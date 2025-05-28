#pragma once

#include "qmark.hpp"
#include "database/database_manager.hpp"
#include "security/auth_handler.hpp"

#include <memory>
#include <functional>

namespace qmark {

class HttpServerManager {
private:
    std::unique_ptr<HttpServer> server_;
    std::shared_ptr<DatabaseManager> db_manager_;
    std::unique_ptr<AuthHandler> auth_handler_;
    bool running_;

public:
    explicit HttpServerManager(std::shared_ptr<DatabaseManager> db_manager);
    ~HttpServerManager();

    // Server configuration
    void set_mount_point(const std::string& mount_point, const std::string& dir);
    void set_file_extension_and_mimetype_mapping(const std::string& ext, const std::string& mime);
    void set_pre_routing_handler(std::function<httplib::Server::HandlerResponse(const HttpRequest&, HttpResponse&)> handler);

    // Route registration
    void register_routes();
    void register_auth_routes();
    void register_api_routes();
    void register_dashboard_routes();
    void register_oauth_routes();
    void register_test_routes();

    // Server lifecycle
    bool start(const std::string& host, int port);
    void stop();
    bool is_running() const { return running_; }

private:
    // Middleware
    void setup_middleware();
    void setup_cors();
    void setup_logging();
    void setup_error_handling();

    // Route handlers - Authentication
    void handle_get_user(const HttpRequest& req, HttpResponse& res);
    void handle_logout(const HttpRequest& req, HttpResponse& res);
    void handle_login(const HttpRequest& req, HttpResponse& res);
    void handle_callback(const HttpRequest& req, HttpResponse& res);

    // Route handlers - Dashboard
    void handle_dashboard_stats(const HttpRequest& req, HttpResponse& res);
    void handle_dashboard_activities(const HttpRequest& req, HttpResponse& res);

    // Route handlers - OAuth
    void handle_oauth_initiate(const HttpRequest& req, HttpResponse& res);
    void handle_oauth_callback(const HttpRequest& req, HttpResponse& res);
    void handle_oauth_connections(const HttpRequest& req, HttpResponse& res);
    void handle_oauth_delete_connection(const HttpRequest& req, HttpResponse& res);

    // Route handlers - Test endpoints
    void handle_test_system_complete(const HttpRequest& req, HttpResponse& res);
    void handle_test_facebook(const HttpRequest& req, HttpResponse& res);
    void handle_test_google(const HttpRequest& req, HttpResponse& res);

    // Utility methods
    std::optional<User> authenticate_request(const HttpRequest& req);
    void send_json_response(HttpResponse& res, const json& data, int status = 200);
    void send_error_response(HttpResponse& res, const std::string& message, int status = 500);
    std::string get_request_body(const HttpRequest& req);
    std::string extract_bearer_token(const HttpRequest& req);
};

} // namespace qmark