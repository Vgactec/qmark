#include "qmark.hpp"
#include "server/http_server.hpp"
#include "database/database_manager.hpp"
#include "utils/logger.hpp"
#include "security/encryption.hpp"

#include <iostream>
#include <memory>
#include <signal.h>

using namespace qmark;

// Global server instance for graceful shutdown
std::unique_ptr<HttpServerManager> g_server;

void signal_handler(int signal) {
    if (signal == SIGINT || signal == SIGTERM) {
        Logger::info("Received shutdown signal, stopping server...");
        if (g_server) {
            g_server->stop();
        }
        exit(0);
    }
}

int main() {
    try {
        // Initialize logger
        Logger::init("qmark-server.log");
        Logger::info("Starting QMARK C++ Server v1.0.0");

        // Setup signal handlers for graceful shutdown
        signal(SIGINT, signal_handler);
        signal(SIGTERM, signal_handler);

        // Initialize database
        auto db_manager = std::make_shared<DatabaseManager>("qmark.db");
        if (!db_manager->initialize()) {
            Logger::error("Failed to initialize database");
            return -1;
        }
        Logger::info("Database initialized successfully");

        // Initialize encryption
        SecurityManager::initialize();
        Logger::info("Security manager initialized");

        // Create and configure HTTP server
        g_server = std::make_unique<HttpServerManager>(db_manager);
        
        // Configure server settings
        g_server->set_mount_point("/static", "./public");
        g_server->set_file_extension_and_mimetype_mapping("css", "text/css");
        g_server->set_file_extension_and_mimetype_mapping("js", "application/javascript");
        g_server->set_file_extension_and_mimetype_mapping("json", "application/json");

        // Enable CORS for development
        g_server->set_pre_routing_handler([](const HttpRequest& req, HttpResponse& res) {
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return httplib::Server::HandlerResponse::Unhandled;
        });

        // Register all API routes
        g_server->register_routes();

        Logger::info("Server configured, starting on port 5000...");

        // Start server (blocks until shutdown)
        if (!g_server->start("0.0.0.0", 5000)) {
            Logger::error("Failed to start server on port 5000");
            return -1;
        }

        Logger::info("Server started successfully");

    } catch (const std::exception& e) {
        Logger::error(std::format("Server error: {}", e.what()));
        return -1;
    }

    return 0;
}