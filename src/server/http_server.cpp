#include "server/http_server.hpp"
#include "utils/logger.hpp"
#include "security/encryption.hpp"
#include "database/database_manager.hpp"
#include <nlohmann/json.hpp>
#include <thread>

using json = nlohmann::json;

namespace QMark {

HttpServer::HttpServer() : server_(std::make_unique<httplib::Server>()) {
    setupMiddleware();
}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::setupMiddleware() {
    // CORS middleware
    server_->set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // Logging middleware
    server_->set_logger([](const httplib::Request& req, const httplib::Response& res) {
        Logger::info("HTTP " + req.method + " " + req.path + " -> " + std::to_string(res.status));
    });

    // Error handler
    server_->set_error_handler([](const httplib::Request&, httplib::Response& res) {
        json error_response = {
            {"error", "Internal Server Error"},
            {"code", res.status}
        };
        res.set_content(error_response.dump(), "application/json");
    });
}

void HttpServer::setupRoutes() {
    // Health check
    server_->Get("/health", [](const httplib::Request&, httplib::Response& res) {
        json response = {
            {"status", "healthy"},
            {"service", "qmark-server"},
            {"version", "1.0.0"},
            {"timestamp", std::time(nullptr)}
        };
        res.set_content(response.dump(), "application/json");
    });

    // API Info
    server_->Get("/api/info", [](const httplib::Request&, httplib::Response& res) {
        json response = {
            {"name", "QMARK API"},
            {"version", "1.0.0"},
            {"description", "High-performance C++ API server"},
            {"endpoints", {
                {{"path", "/health"}, {"method", "GET"}, {"description", "Health check"}},
                {{"path", "/api/info"}, {"method", "GET"}, {"description", "API information"}},
                {{"path", "/api/data"}, {"method", "GET"}, {"description", "Get data"}},
                {{"path", "/api/data"}, {"method", "POST"}, {"description", "Create data"}}
            }}
        };
        res.set_content(response.dump(), "application/json");
    });

    // Data endpoints
    server_->Get("/api/data", [this](const httplib::Request& req, httplib::Response& res) {
        handleGetData(req, res);
    });

    server_->Post("/api/data", [this](const httplib::Request& req, httplib::Response& res) {
        handlePostData(req, res);
    });

    // Static file serving
    server_->set_mount_point("/static", "./public");

    // OPTIONS handler for CORS
    server_->Options(".*", [](const httplib::Request&, httplib::Response& res) {
        return;
    });

    Logger::info("Routes configured successfully");
}

bool HttpServer::start(const std::string& host, int port) {
    host_ = host;
    port_ = port;

    try {
        // Start server in a separate thread
        server_thread_ = std::thread([this]() {
            server_->listen(host_.c_str(), port_);
        });

        // Wait a bit to ensure server started
        std::this_thread::sleep_for(std::chrono::milliseconds(100));

        return server_->is_running();
    } catch (const std::exception& e) {
        Logger::error("Failed to start server: " + std::string(e.what()));
        return false;
    }
}

void HttpServer::stop() {
    if (server_ && server_->is_running()) {
        server_->stop();
        if (server_thread_.joinable()) {
            server_thread_.join();
        }
        Logger::info("Server stopped");
    }
}

void HttpServer::waitForStop() {
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
}

void HttpServer::handleGetData(const httplib::Request& req, httplib::Response& res) {
    try {
        // Get query parameters
        std::string limit = req.get_param_value("limit");
        std::string offset = req.get_param_value("offset");

        // Mock data for now
        json response = {
            {"data", {
                {{"id", 1}, {"name", "Sample Data 1"}, {"value", 100}},
                {{"id", 2}, {"name", "Sample Data 2"}, {"value", 200}},
                {{"id", 3}, {"name", "Sample Data 3"}, {"value", 300}}
            }},
            {"total", 3},
            {"limit", limit.empty() ? 10 : std::stoi(limit)},
            {"offset", offset.empty() ? 0 : std::stoi(offset)}
        };

        res.set_content(response.dump(), "application/json");
        Logger::info("Data retrieved successfully");

    } catch (const std::exception& e) {
        json error = {
            {"error", "Failed to retrieve data"},
            {"message", e.what()}
        };
        res.status = 500;
        res.set_content(error.dump(), "application/json");
        Logger::error("Error retrieving data: " + std::string(e.what()));
    }
}

void HttpServer::handlePostData(const httplib::Request& req, httplib::Response& res) {
    try {
        // Parse JSON body
        json request_data = json::parse(req.body);

        // Validate required fields
        if (!request_data.contains("name") || !request_data.contains("value")) {
            json error = {
                {"error", "Missing required fields"},
                {"required", {"name", "value"}}
            };
            res.status = 400;
            res.set_content(error.dump(), "application/json");
            return;
        }

        // Mock response
        json response = {
            {"id", 4},
            {"name", request_data["name"]},
            {"value", request_data["value"]},
            {"created_at", std::time(nullptr)},
            {"status", "created"}
        };

        res.status = 201;
        res.set_content(response.dump(), "application/json");
        Logger::info("Data created successfully");

    } catch (const json::parse_error& e) {
        json error = {
            {"error", "Invalid JSON"},
            {"message", e.what()}
        };
        res.status = 400;
        res.set_content(error.dump(), "application/json");
        Logger::error("JSON parse error: " + std::string(e.what()));

    } catch (const std::exception& e) {
        json error = {
            {"error", "Failed to create data"},
            {"message", e.what()}
        };
        res.status = 500;
        res.set_content(error.dump(), "application/json");
        Logger::error("Error creating data: " + std::string(e.what()));
    }
}

} // namespace QMark