
#pragma once

#include "qmark.hpp"
#include <httplib.h>
#include <functional>
#include <thread>
#include <atomic>

namespace qmark::server {
    
    using RouteHandler = std::function<JsonResponse(const HttpRequest&)>;
    using MiddlewareHandler = std::function<bool(const HttpRequest&, JsonResponse&)>;
    
    class HttpServer {
    private:
        std::unique_ptr<httplib::Server> server_;
        ServerConfig config_;
        std::vector<MiddlewareHandler> middlewares_;
        std::atomic<bool> is_running_;
        std::thread server_thread_;
        
        // Méthodes privées
        void setup_routes();
        void setup_middlewares();
        void setup_cors();
        void setup_error_handlers();
        HttpRequest convert_request(const httplib::Request& req);
        void send_response(httplib::Response& res, const JsonResponse& json_response);
        
        // Handlers d'API
        JsonResponse handle_auth_user(const HttpRequest& req);
        JsonResponse handle_auth_logout(const HttpRequest& req);
        JsonResponse handle_dashboard_stats(const HttpRequest& req);
        JsonResponse handle_oauth_connections(const HttpRequest& req);
        JsonResponse handle_oauth_connect(const HttpRequest& req);
        JsonResponse handle_oauth_disconnect(const HttpRequest& req);
        JsonResponse handle_system_health(const HttpRequest& req);
        JsonResponse handle_system_complete(const HttpRequest& req);
        
        // Middleware handlers
        bool cors_middleware(const HttpRequest& req, JsonResponse& res);
        bool auth_middleware(const HttpRequest& req, JsonResponse& res);
        bool rate_limit_middleware(const HttpRequest& req, JsonResponse& res);
        bool logging_middleware(const HttpRequest& req, JsonResponse& res);
        
    public:
        explicit HttpServer(const ServerConfig& config = ServerConfig{});
        ~HttpServer();
        
        // Configuration
        void set_config(const ServerConfig& config);
        const ServerConfig& get_config() const;
        
        // Middleware
        void add_middleware(MiddlewareHandler middleware);
        void clear_middlewares();
        
        // Routes personnalisées
        void add_route(const std::string& method, 
                      const std::string& path, 
                      RouteHandler handler);
        
        // Contrôle du serveur
        bool start();
        void stop();
        bool is_running() const;
        void wait_for_shutdown();
        
        // Statistiques
        size_t get_active_connections() const;
        uint64_t get_requests_count() const;
        
        // Utilitaires
        static std::string get_client_ip(const HttpRequest& req);
        static std::string generate_session_id();
        static bool validate_json(const std::string& json_str);
    };
    
    // Fonctions utilitaires pour JSON
    namespace json_utils {
        std::string serialize_user(const User& user);
        std::string serialize_oauth_connection(const OAuthConnection& connection);
        std::string serialize_dashboard_metrics(const DashboardMetrics& metrics);
        std::string serialize_error(const std::string& message, int code = 400);
        std::string serialize_success(const std::string& message = "OK");
        
        bool parse_user(const std::string& json, User& user);
        bool parse_oauth_connection(const std::string& json, OAuthConnection& connection);
    }
}
