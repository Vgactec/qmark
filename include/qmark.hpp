#pragma once

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <functional>
#include <chrono>
#include <optional>

// Version du projet
#define QMARK_VERSION "1.0.0"
#define QMARK_VERSION_MAJOR 1
#define QMARK_VERSION_MINOR 0
#define QMARK_VERSION_PATCH 0

// Configuration par défaut
#define DEFAULT_PORT 5000
#define DEFAULT_HOST "0.0.0.0"
#define DEFAULT_DATABASE_PATH "./qmark.db"

// Types communs
namespace qmark {
    using UserId = uint64_t;
    using ConnectionId = uint64_t;
    using Timestamp = std::chrono::system_clock::time_point;

    // Structure pour les réponses JSON
    struct JsonResponse {
        int status_code = 200;
        std::string content_type = "application/json";
        std::string body;
        std::unordered_map<std::string, std::string> headers;
    };

    // Structure pour les requêtes HTTP
    struct HttpRequest {
        std::string method;
        std::string path;
        std::unordered_map<std::string, std::string> headers;
        std::unordered_map<std::string, std::string> params;
        std::string body;
        std::string remote_addr;
    };

    // Structure utilisateur
    struct User {
        UserId id = 0;
        std::string username;
        std::string email;
        std::string display_name;
        std::string avatar_url;
        std::string replit_user_id;
        Timestamp created_at;
        Timestamp updated_at;
        bool is_premium = false;
    };

    // Structure de connexion OAuth
    struct OAuthConnection {
        ConnectionId id = 0;
        UserId user_id = 0;
        std::string provider;
        std::string provider_user_id;
        std::string encrypted_access_token;
        std::string encrypted_refresh_token;
        Timestamp expires_at;
        Timestamp created_at;
        Timestamp updated_at;
        bool is_active = true;
    };

    // Métriques dashboard
    struct DashboardMetrics {
        uint64_t total_leads = 0;
        uint64_t total_connections = 0;
        uint64_t active_automations = 0;
        double conversion_rate = 0.0;
        uint64_t messages_sent_today = 0;
    };

    // Configuration du serveur
    struct ServerConfig {
        std::string host = DEFAULT_HOST;
        int port = DEFAULT_PORT;
        std::string database_path = DEFAULT_DATABASE_PATH;
        std::string cors_origin = "*";
        bool enable_ssl = false;
        std::string ssl_cert_path;
        std::string ssl_key_path;
        int max_connections = 1000;
        int thread_pool_size = 4;
    };
}