
#include "security/encryption.hpp"
#include "utils/logger.hpp"
#include <random>
#include <algorithm>
#include <iomanip>
#include <sstream>
#include <cstdlib>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/sha.h>

namespace qmark {

std::string SecurityManager::encryption_key_;
bool SecurityManager::initialized_ = false;

void SecurityManager::initialize(const std::string& key) {
    if (initialized_) return;
    
    if (key.empty()) {
        const char* env_key = std::getenv("ENCRYPTION_KEY");
        if (env_key) {
            encryption_key_ = env_key;
        } else {
            encryption_key_ = generate_key();
            Logger::warning("Using generated encryption key. Set ENCRYPTION_KEY environment variable for production.");
        }
    } else {
        encryption_key_ = key;
    }
    
    initialized_ = true;
    Logger::info("SecurityManager initialized");
}

std::string SecurityManager::encrypt(const std::string& plaintext) {
    if (!initialized_) initialize();
    
    try {
        // Simple XOR encryption for demonstration
        // In production, use proper AES encryption
        std::string encrypted = plaintext;
        for (size_t i = 0; i < encrypted.length(); ++i) {
            encrypted[i] ^= encryption_key_[i % encryption_key_.length()];
        }
        
        // Convert to hex
        std::stringstream ss;
        for (unsigned char c : encrypted) {
            ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(c);
        }
        
        return ss.str();
        
    } catch (const std::exception& e) {
        Logger::error("Encryption failed: " + std::string(e.what()));
        return "";
    }
}

std::optional<std::string> SecurityManager::decrypt(const std::string& ciphertext) {
    if (!initialized_) initialize();
    
    try {
        // Convert from hex
        std::string encrypted;
        for (size_t i = 0; i < ciphertext.length(); i += 2) {
            std::string byte_str = ciphertext.substr(i, 2);
            unsigned char byte = static_cast<unsigned char>(std::stoi(byte_str, nullptr, 16));
            encrypted.push_back(byte);
        }
        
        // XOR decrypt
        std::string decrypted = encrypted;
        for (size_t i = 0; i < decrypted.length(); ++i) {
            decrypted[i] ^= encryption_key_[i % encryption_key_.length()];
        }
        
        return decrypted;
        
    } catch (const std::exception& e) {
        Logger::error("Decryption failed: " + std::string(e.what()));
        return std::nullopt;
    }
}

std::string SecurityManager::generate_token(size_t length) {
    const std::string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, chars.size() - 1);
    
    std::string token;
    token.reserve(length);
    
    for (size_t i = 0; i < length; ++i) {
        token += chars[dis(gen)];
    }
    
    return token;
}

std::string SecurityManager::hash_password(const std::string& password) {
    // Simple SHA256 hash for demonstration
    // In production, use proper bcrypt or Argon2
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, password.c_str(), password.length());
    SHA256_Final(hash, &sha256);
    
    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash[i]);
    }
    
    return ss.str();
}

bool SecurityManager::verify_password(const std::string& password, const std::string& hash) {
    return hash_password(password) == hash;
}

std::string SecurityManager::generate_key() {
    return generate_token(32);
}

std::vector<uint8_t> SecurityManager::string_to_bytes(const std::string& str) {
    std::vector<uint8_t> bytes(str.begin(), str.end());
    return bytes;
}

std::string SecurityManager::bytes_to_string(const std::vector<uint8_t>& bytes) {
    std::string str(bytes.begin(), bytes.end());
    return str;
}

} // namespace qmark
