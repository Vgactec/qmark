
#pragma once

#include <string>
#include <vector>
#include <memory>
#include <openssl/aes.h>
#include <openssl/rand.h>
#include <openssl/evp.h>

namespace qmark::security {
    
    class AESEncryption {
    private:
        static constexpr size_t KEY_SIZE = 32;  // 256 bits
        static constexpr size_t IV_SIZE = 16;   // 128 bits
        static constexpr size_t BLOCK_SIZE = 16;
        
        std::vector<uint8_t> encryption_key_;
        bool is_initialized_;
        
        // Méthodes privées
        bool derive_key_from_password(const std::string& password, 
                                     const std::vector<uint8_t>& salt);
        std::vector<uint8_t> generate_random_bytes(size_t length);
        
    public:
        AESEncryption();
        explicit AESEncryption(const std::string& password);
        explicit AESEncryption(const std::vector<uint8_t>& key);
        ~AESEncryption();
        
        // Initialisation
        bool initialize(const std::string& password);
        bool initialize(const std::vector<uint8_t>& key);
        bool is_ready() const;
        
        // Chiffrement/Déchiffrement
        std::string encrypt(const std::string& plaintext);
        std::string decrypt(const std::string& ciphertext);
        
        // Chiffrement binaire
        std::vector<uint8_t> encrypt_bytes(const std::vector<uint8_t>& data);
        std::vector<uint8_t> decrypt_bytes(const std::vector<uint8_t>& encrypted_data);
        
        // Utilitaires
        static std::string generate_random_password(size_t length = 32);
        static std::vector<uint8_t> generate_random_key();
        static std::string encode_base64(const std::vector<uint8_t>& data);
        static std::vector<uint8_t> decode_base64(const std::string& encoded);
        
        // Hash et signature
        static std::string sha256_hash(const std::string& data);
        static std::string hmac_sha256(const std::string& data, const std::string& key);
        static bool verify_hmac(const std::string& data, 
                               const std::string& hmac, 
                               const std::string& key);
    };
    
    // Classe pour la gestion des tokens JWT (simplifié)
    class TokenManager {
    private:
        std::unique_ptr<AESEncryption> encryption_;
        std::string secret_key_;
        uint64_t default_expiry_hours_;
        
    public:
        explicit TokenManager(const std::string& secret_key, 
                             uint64_t expiry_hours = 24);
        
        // Génération et validation de tokens
        std::string generate_token(const std::string& user_id, 
                                  const std::string& username = "",
                                  uint64_t custom_expiry_hours = 0);
        bool validate_token(const std::string& token);
        std::string extract_user_id(const std::string& token);
        std::string extract_username(const std::string& token);
        uint64_t get_token_expiry(const std::string& token);
        
        // Gestion des sessions
        std::string create_session_token(const User& user);
        bool validate_session_token(const std::string& token, User& user);
        void invalidate_token(const std::string& token);
        
        // Utilitaires
        static std::string generate_csrf_token();
        static bool validate_csrf_token(const std::string& token, 
                                       const std::string& session_token);
    };
    
    // Singleton pour l'accès global
    class SecurityManager {
    private:
        static std::unique_ptr<AESEncryption> global_encryption_;
        static std::unique_ptr<TokenManager> global_token_manager_;
        static std::mutex security_mutex_;
        
    public:
        static void initialize(const std::string& master_key);
        static AESEncryption& get_encryption();
        static TokenManager& get_token_manager();
        static void shutdown();
    };
}
