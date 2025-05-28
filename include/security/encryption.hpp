
#pragma once

#include <string>
#include <vector>
#include <optional>

namespace qmark {

class SecurityManager {
private:
    static std::string encryption_key_;
    static bool initialized_;
    
public:
    static void initialize(const std::string& key = "");
    static std::string encrypt(const std::string& plaintext);
    static std::optional<std::string> decrypt(const std::string& ciphertext);
    static std::string generate_token(size_t length = 32);
    static std::string hash_password(const std::string& password);
    static bool verify_password(const std::string& password, const std::string& hash);
    
private:
    static std::string generate_key();
    static std::vector<uint8_t> string_to_bytes(const std::string& str);
    static std::string bytes_to_string(const std::vector<uint8_t>& bytes);
};

} // namespace qmark
