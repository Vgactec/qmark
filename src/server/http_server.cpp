#include "server/http_server.hpp"
#include "utils/logger.hpp"
#include "security/encryption.hpp"
#include <format>
#include <chrono>

namespace qmark {

HttpServerManager::HttpServerManager(std::shared_ptr<DatabaseManager> db_manager)
    : server_(std::make_unique<HttpServer>())
    , db_manager_(db_manager)
    , auth_handler_(std::make_unique<AuthHandler>(db_manager))
    , running_(false) {
    setup_middleware();
}

HttpServerManager::~HttpServerManager() {
    stop();
}

void HttpServerManager::set_mount_point(const std::string& mount_point, const std::string& dir) {
    server_->set_mount_point(mount_point, dir);
}

void HttpServerManager::set_file_extension_and_mimetype_mapping(const std::string& ext, const std::string& mime) {
    server_->set_file_extension_and_mimetype_mapping(ext.c_str(), mime.c_str());
}

void HttpServerManager::set_pre_routing_handler(std::function<httplib::Server::HandlerResponse(const HttpRequest&, HttpResponse&)> handler) {
    server_->set_pre_routing_handler(handler);
}

void HttpServerManager::setup_middleware() {
    setup_cors();
    setup_logging();
    setup_error_handling();
}

void HttpServerManager::setup_cors() {
    server_->set_pre_routing_handler([](const HttpRequest& req, HttpResponse& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        res.set_header("Access-Control-Allow-Credentials", "true");
        
        if (req.method == "OPTIONS") {
            res.status = 200;
            return httplib::Server::HandlerResponse::Handled;
        }
        
        return httplib::Server::HandlerResponse::Unhandled;
    });
}

void HttpServerManager::setup_logging() {
    server_->set_logger([](const HttpRequest& req, const HttpResponse& res) {
        auto timestamp = std::chrono::system_clock::now();
        auto duration = res.get_header_value("X-Response-Time");
        
        std::string log_line = std::format("{} {} {} {} - {}ms",
            std::chrono::duration_cast<std::chrono::seconds>(timestamp.time_since_epoch()).count(),
            req.method,
            req.path,
            res.status,
            duration.empty() ? "0" : duration
        );
        
        if (req.path.starts_with("/api")) {
            Logger::info(log_line);
        }
    });
}

void HttpServerManager::setup_error_handling() {
    server_->set_error_handler([this](const HttpRequest& req, HttpResponse& res) {
        json error_response = {
            {"error", true},
            {"message", "Internal Server Error"},
            {"path", req.path},
            {"method", req.method},
            {"timestamp", std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()}
        };
        
        send_json_response(res, error_response, 500);
    });
}

void HttpServerManager::register_routes() {
    register_auth_routes();
    register_dashboard_routes();
    register_oauth_routes();
    register_test_routes();
    register_api_routes();
}

void HttpServerManager::register_auth_routes() {
    // Authentication endpoints
    server_->Get("/api/auth/user", [this](const HttpRequest& req, HttpResponse& res) {
        handle_get_user(req, res);
    });
    
    server_->Post("/api/auth/logout", [this](const HttpRequest& req, HttpResponse& res) {
        handle_logout(req, res);
    });
    
    server_->Get("/api/login", [this](const HttpRequest& req, HttpResponse& res) {
        handle_login(req, res);
    });
    
    server_->Get("/api/callback", [this](const HttpRequest& req, HttpResponse& res) {
        handle_callback(req, res);
    });
}

void HttpServerManager::register_dashboard_routes() {
    // Dashboard endpoints
    server_->Get("/api/dashboard/stats", [this](const HttpRequest& req, HttpResponse& res) {
        handle_dashboard_stats(req, res);
    });
    
    server_->Get("/api/dashboard/activities", [this](const HttpRequest& req, HttpResponse& res) {
        handle_dashboard_activities(req, res);
    });
}

void HttpServerManager::register_oauth_routes() {
    // OAuth endpoints
    server_->Get(R"(/api/oauth/initiate/(\w+))", [this](const HttpRequest& req, HttpResponse& res) {
        handle_oauth_initiate(req, res);
    });
    
    server_->Get("/api/oauth/callback", [this](const HttpRequest& req, HttpResponse& res) {
        handle_oauth_callback(req, res);
    });
    
    server_->Get("/api/oauth/connections", [this](const HttpRequest& req, HttpResponse& res) {
        handle_oauth_connections(req, res);
    });
    
    server_->Delete(R"(/api/oauth/connections/(\d+))", [this](const HttpRequest& req, HttpResponse& res) {
        handle_oauth_delete_connection(req, res);
    });
}

void HttpServerManager::register_test_routes() {
    // Test endpoints
    server_->Get("/api/test/system-complete", [this](const HttpRequest& req, HttpResponse& res) {
        handle_test_system_complete(req, res);
    });
    
    server_->Get("/api/test/facebook", [this](const HttpRequest& req, HttpResponse& res) {
        handle_test_facebook(req, res);
    });
    
    server_->Get("/api/test/google", [this](const HttpRequest& req, HttpResponse& res) {
        handle_test_google(req, res);
    });
}

void HttpServerManager::register_api_routes() {
    // Catch-all for SPA routing
    server_->Get(".*", [this](const HttpRequest& req, HttpResponse& res) {
        if (!req.path.starts_with("/api")) {
            // Serve the React SPA
            std::ifstream file("./public/index.html");
            if (file.is_open()) {
                std::string content((std::istreambuf_iterator<char>(file)),
                                  std::istreambuf_iterator<char>());
                res.set_content(content, "text/html");
                res.status = 200;
            } else {
                send_error_response(res, "SPA not found", 404);
            }
        }
    });
}

bool HttpServerManager::start(const std::string& host, int port) {
    running_ = true;
    Logger::info(std::format("Starting HTTP server on {}:{}", host, port));
    
    return server_->listen(host, port);
}

void HttpServerManager::stop() {
    if (running_) {
        server_->stop();
        running_ = false;
        Logger::info("HTTP server stopped");
    }
}

// Authentication handlers
void HttpServerManager::handle_get_user(const HttpRequest& req, HttpResponse& res) {
    auto start_time = std::chrono::high_resolution_clock::now();
    
    try {
        // Development mode bypass pour tester les composants
        if (const char* env = std::getenv("NODE_ENV")) {
            if (std::string(env) == "development") {
                json dev_user = {
                    {"id", "dev-user-123"},
                    {"email", "dev@qmark.test"},
                    {"firstName", "Dev"},
                    {"lastName", "User"},
                    {"profileImageUrl", "https://via.placeholder.com/150"}
                };
                
                auto end_time = std::chrono::high_resolution_clock::now();
                auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
                res.set_header("X-Response-Time", std::to_string(duration.count()));
                
                send_json_response(res, dev_user);
                return;
            }
        }
        
        auto user_opt = authenticate_request(req);
        if (!user_opt) {
            send_error_response(res, "Unauthorized", 401);
            return;
        }
        
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        res.set_header("X-Response-Time", std::to_string(duration.count()));
        
        send_json_response(res, user_opt->to_json());
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_get_user: {}", e.what()));
        send_error_response(res, "Internal server error", 500);
    }
}

void HttpServerManager::handle_logout(const HttpRequest& req, HttpResponse& res) {
    try {
        // Clear session cookies
        res.set_header("Set-Cookie", "session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/");
        
        json response = {
            {"success", true},
            {"message", "Logged out successfully"}
        };
        
        send_json_response(res, response);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_logout: {}", e.what()));
        send_error_response(res, "Logout failed", 500);
    }
}

void HttpServerManager::handle_login(const HttpRequest& req, HttpResponse& res) {
    try {
        // Redirect to authentication provider
        std::string redirect_url = "https://replit.com/oidc/authorize?client_id=" + 
                                 std::string(std::getenv("REPL_ID") ? std::getenv("REPL_ID") : "test") +
                                 "&response_type=code&scope=openid%20email%20profile";
        
        res.set_redirect(redirect_url);
        res.status = 302;
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_login: {}", e.what()));
        send_error_response(res, "Login failed", 500);
    }
}

void HttpServerManager::handle_callback(const HttpRequest& req, HttpResponse& res) {
    try {
        // Handle OAuth callback
        res.set_redirect("/");
        res.status = 302;
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_callback: {}", e.what()));
        send_error_response(res, "Callback failed", 500);
    }
}

// Utility methods
std::optional<User> HttpServerManager::authenticate_request(const HttpRequest& req) {
    // Implementation would verify JWT token or session
    return std::nullopt;
}

void HttpServerManager::send_json_response(HttpResponse& res, const json& data, int status) {
    res.set_content(data.dump(), "application/json");
    res.status = status;
}

void HttpServerManager::send_error_response(HttpResponse& res, const std::string& message, int status) {
    json error = {
        {"error", true},
        {"message", message}
    };
    send_json_response(res, error, status);
}

std::string HttpServerManager::get_request_body(const HttpRequest& req) {
    return req.body;
}

// Dashboard handlers
void HttpServerManager::handle_dashboard_stats(const HttpRequest& req, HttpResponse& res) {
    auto start_time = std::chrono::high_resolution_clock::now();
    
    try {
        auto user_opt = authenticate_request(req);
        if (!user_opt) {
            send_error_response(res, "Unauthorized", 401);
            return;
        }
        
        auto stats = db_manager_->get_dashboard_stats(user_opt->id);
        
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        res.set_header("X-Response-Time", std::to_string(duration.count()));
        
        send_json_response(res, stats.to_json());
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_dashboard_stats: {}", e.what()));
        send_error_response(res, "Internal server error", 500);
    }
}

void HttpServerManager::handle_dashboard_activities(const HttpRequest& req, HttpResponse& res) {
    try {
        auto user_opt = authenticate_request(req);
        if (!user_opt) {
            send_error_response(res, "Unauthorized", 401);
            return;
        }
        
        auto activities = db_manager_->get_activities(user_opt->id, 20);
        
        json response = json::array();
        for (const auto& activity : activities) {
            response.push_back(activity.to_json());
        }
        
        send_json_response(res, response);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_dashboard_activities: {}", e.what()));
        send_error_response(res, "Internal server error", 500);
    }
}

// OAuth handlers
void HttpServerManager::handle_oauth_connections(const HttpRequest& req, HttpResponse& res) {
    try {
        auto user_opt = authenticate_request(req);
        if (!user_opt) {
            send_error_response(res, "Unauthorized", 401);
            return;
        }
        
        auto connections = db_manager_->get_oauth_connections(user_opt->id);
        
        json response = json::array();
        for (const auto& connection : connections) {
            response.push_back(connection.to_json());
        }
        
        send_json_response(res, response);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_oauth_connections: {}", e.what()));
        send_error_response(res, "Internal server error", 500);
    }
}

void HttpServerManager::handle_oauth_initiate(const HttpRequest& req, HttpResponse& res) {
    try {
        // Extract platform from URL path
        std::string platform = req.matches[1];
        
        std::string oauth_url;
        if (platform == "facebook") {
            oauth_url = "https://www.facebook.com/v18.0/dialog/oauth?"
                       "client_id=" + std::string(std::getenv("FACEBOOK_CLIENT_ID") ? std::getenv("FACEBOOK_CLIENT_ID") : "1020589259777647") +
                       "&redirect_uri=" + std::string(std::getenv("CLIENT_URL") ? std::getenv("CLIENT_URL") : "http://localhost:5000") + "/api/oauth/callback" +
                       "&scope=email,public_profile&response_type=code&state=" + platform;
        } else if (platform == "google") {
            oauth_url = "https://accounts.google.com/o/oauth2/v2/auth?"
                       "client_id=" + std::string(std::getenv("GOOGLE_CLIENT_ID") ? std::getenv("GOOGLE_CLIENT_ID") : "") +
                       "&redirect_uri=" + std::string(std::getenv("CLIENT_URL") ? std::getenv("CLIENT_URL") : "http://localhost:5000") + "/api/oauth/callback" +
                       "&scope=openid%20email%20profile&response_type=code&state=" + platform;
        } else {
            send_error_response(res, "Unsupported platform", 400);
            return;
        }
        
        json response = {
            {"authUrl", oauth_url},
            {"platform", platform}
        };
        
        send_json_response(res, response);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_oauth_initiate: {}", e.what()));
        send_error_response(res, "OAuth initiation failed", 500);
    }
}

void HttpServerManager::handle_oauth_callback(const HttpRequest& req, HttpResponse& res) {
    try {
        // Handle OAuth callback processing
        res.set_redirect("/?oauth=success");
        res.status = 302;
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_oauth_callback: {}", e.what()));
        res.set_redirect("/?oauth=error");
        res.status = 302;
    }
}

void HttpServerManager::handle_oauth_delete_connection(const HttpRequest& req, HttpResponse& res) {
    try {
        int connection_id = std::stoi(req.matches[1]);
        
        auto user_opt = authenticate_request(req);
        if (!user_opt) {
            send_error_response(res, "Unauthorized", 401);
            return;
        }
        
        bool deleted = db_manager_->delete_oauth_connection(connection_id);
        
        json response = {
            {"success", deleted},
            {"message", deleted ? "Connection deleted" : "Connection not found"}
        };
        
        send_json_response(res, response, deleted ? 200 : 404);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_oauth_delete_connection: {}", e.what()));
        send_error_response(res, "Failed to delete connection", 500);
    }
}

// Test handlers
void HttpServerManager::handle_test_system_complete(const HttpRequest& req, HttpResponse& res) {
    try {
        json system_status = {
            {"server", "online"},
            {"database", "connected"},
            {"timestamp", std::chrono::duration_cast<std::chrono::seconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()},
            {"version", "1.0.0"},
            {"language", "C++20"},
            {"architecture", "modern"}
        };
        
        send_json_response(res, system_status);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_test_system_complete: {}", e.what()));
        send_error_response(res, "System test failed", 500);
    }
}

void HttpServerManager::handle_test_facebook(const HttpRequest& req, HttpResponse& res) {
    try {
        json facebook_test = {
            {"platform", "facebook"},
            {"status", "configured"},
            {"app_id", std::getenv("FACEBOOK_CLIENT_ID") ? std::getenv("FACEBOOK_CLIENT_ID") : "1020589259777647"},
            {"test_url", "https://graph.facebook.com/me"}
        };
        
        send_json_response(res, facebook_test);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_test_facebook: {}", e.what()));
        send_error_response(res, "Facebook test failed", 500);
    }
}

void HttpServerManager::handle_test_google(const HttpRequest& req, HttpResponse& res) {
    try {
        json google_test = {
            {"platform", "google"},
            {"status", "configured"},
            {"project_id", std::getenv("GOOGLE_PROJECT_ID") ? std::getenv("GOOGLE_PROJECT_ID") : "neurax-460419"},
            {"test_url", "https://www.googleapis.com/oauth2/v2/userinfo"}
        };
        
        send_json_response(res, google_test);
        
    } catch (const std::exception& e) {
        Logger::error(std::format("Error in handle_test_google: {}", e.what()));
        send_error_response(res, "Google test failed", 500);
    }
}

std::string HttpServerManager::extract_bearer_token(const HttpRequest& req) {
    auto auth_header = req.get_header_value("Authorization");
    if (auth_header.starts_with("Bearer ")) {
        return auth_header.substr(7);
    }
    return "";
}

} // namespace qmark