
#include "security/encryption.hpp"
#include "utils/logger.hpp"
#include <openssl/rand.h>
#include <openssl/evp.h>
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>

namespace QMark {

std::string Encryption::generateSalt(size_t length) {
    std::vector<unsigned char> salt(length);
    
    if (RAND_bytes(salt.data(), static_cast<int>(length)) != 1) {
        Logger::error("Failed to generate random salt");
        throw std::runtime_error("Failed to generate random salt");
    }
    
    return bytesToHex(salt);
}

std::string Encryption::hashPassword(const std::string& password, const std::string& salt) {
    std::string salted_password = password + salt;
    
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    
    if (SHA256_Init(&sha256) != 1) {
        Logger::error("Failed to initialize SHA256");
        throw std::runtime_error("Failed to initialize SHA256");
    }
    
    if (SHA256_Update(&sha256, salted_password.c_str(), salted_password.length()) != 1) {
        Logger::error("Failed to update SHA256");
        throw std::runtime_error("Failed to update SHA256");
    }
    
    if (SHA256_Final(hash, &sha256) != 1) {
        Logger::error("Failed to finalize SHA256");
        throw std::runtime_error("Failed to finalize SHA256");
    }
    
    return bytesToHex(std::vector<unsigned char>(hash, hash + SHA256_DIGEST_LENGTH));
}

bool Encryption::verifyPassword(const std::string& password, const std::string& hash, const std::string& salt) {
    try {
        std::string computed_hash = hashPassword(password, salt);
        return computed_hash == hash;
    } catch (const std::exception& e) {
        Logger::error("Password verification failed: " + std::string(e.what()));
        return false;
    }
}

std::string Encryption::encrypt(const std::string& plaintext, const std::string& key) {
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) {
        Logger::error("Failed to create cipher context");
        throw std::runtime_error("Failed to create cipher context");
    }
    
    // Generate random IV
    std::vector<unsigned char> iv(EVP_CIPHER_iv_length(EVP_aes_256_cbc()));
    if (RAND_bytes(iv.data(), static_cast<int>(iv.size())) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to generate IV");
        throw std::runtime_error("Failed to generate IV");
    }
    
    // Initialize encryption
    if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), nullptr, 
                           reinterpret_cast<const unsigned char*>(key.c_str()), 
                           iv.data()) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to initialize encryption");
        throw std::runtime_error("Failed to initialize encryption");
    }
    
    std::vector<unsigned char> ciphertext(plaintext.length() + EVP_CIPHER_block_size(EVP_aes_256_cbc()));
    int len;
    int ciphertext_len;
    
    // Encrypt
    if (EVP_EncryptUpdate(ctx, ciphertext.data(), &len, 
                          reinterpret_cast<const unsigned char*>(plaintext.c_str()), 
                          static_cast<int>(plaintext.length())) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to encrypt data");
        throw std::runtime_error("Failed to encrypt data");
    }
    ciphertext_len = len;
    
    // Finalize
    if (EVP_EncryptFinal_ex(ctx, ciphertext.data() + len, &len) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to finalize encryption");
        throw std::runtime_error("Failed to finalize encryption");
    }
    ciphertext_len += len;
    
    EVP_CIPHER_CTX_free(ctx);
    
    // Combine IV and ciphertext
    std::vector<unsigned char> result;
    result.insert(result.end(), iv.begin(), iv.end());
    result.insert(result.end(), ciphertext.begin(), ciphertext.begin() + ciphertext_len);
    
    return bytesToHex(result);
}

std::string Encryption::decrypt(const std::string& ciphertext_hex, const std::string& key) {
    std::vector<unsigned char> data = hexToBytes(ciphertext_hex);
    
    // Extract IV
    size_t iv_length = EVP_CIPHER_iv_length(EVP_aes_256_cbc());
    if (data.size() < iv_length) {
        Logger::error("Invalid ciphertext: too short");
        throw std::runtime_error("Invalid ciphertext: too short");
    }
    
    std::vector<unsigned char> iv(data.begin(), data.begin() + iv_length);
    std::vector<unsigned char> ciphertext(data.begin() + iv_length, data.end());
    
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) {
        Logger::error("Failed to create cipher context");
        throw std::runtime_error("Failed to create cipher context");
    }
    
    // Initialize decryption
    if (EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), nullptr, 
                           reinterpret_cast<const unsigned char*>(key.c_str()), 
                           iv.data()) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to initialize decryption");
        throw std::runtime_error("Failed to initialize decryption");
    }
    
    std::vector<unsigned char> plaintext(ciphertext.size() + EVP_CIPHER_block_size(EVP_aes_256_cbc()));
    int len;
    int plaintext_len;
    
    // Decrypt
    if (EVP_DecryptUpdate(ctx, plaintext.data(), &len, 
                          ciphertext.data(), static_cast<int>(ciphertext.size())) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to decrypt data");
        throw std::runtime_error("Failed to decrypt data");
    }
    plaintext_len = len;
    
    // Finalize
    if (EVP_DecryptFinal_ex(ctx, plaintext.data() + len, &len) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        Logger::error("Failed to finalize decryption");
        throw std::runtime_error("Failed to finalize decryption");
    }
    plaintext_len += len;
    
    EVP_CIPHER_CTX_free(ctx);
    
    return std::string(reinterpret_cast<char*>(plaintext.data()), plaintext_len);
}

std::string Encryption::bytesToHex(const std::vector<unsigned char>& bytes) {
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    
    for (unsigned char byte : bytes) {
        ss << std::setw(2) << static_cast<int>(byte);
    }
    
    return ss.str();
}

std::vector<unsigned char> Encryption::hexToBytes(const std::string& hex) {
    std::vector<unsigned char> bytes;
    
    if (hex.length() % 2 != 0) {
        Logger::error("Invalid hex string: odd length");
        throw std::runtime_error("Invalid hex string: odd length");
    }
    
    for (size_t i = 0; i < hex.length(); i += 2) {
        std::string byte_string = hex.substr(i, 2);
        unsigned char byte = static_cast<unsigned char>(std::stoi(byte_string, nullptr, 16));
        bytes.push_back(byte);
    }
    
    return bytes;
}

} // namespace QMark
