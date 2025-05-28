#include "qmark.hpp"
#include "server/http_server.hpp"
#include "utils/logger.hpp"
#include <iostream>
#include <memory>

int main() {
    try {
        // Initialisation du logger
        QMark::Logger::getInstance().init("logs/qmark.log");
        QMark::Logger::info("Starting QMARK Server v1.0.0");

        // Configuration du serveur
        auto server = std::make_unique<QMark::HttpServer>();

        // Configuration des routes
        server->setupRoutes();

        // Démarrage du serveur
        const int port = 8080;
        QMark::Logger::info("Server starting on port " + std::to_string(port));

        if (server->start("0.0.0.0", port)) {
            QMark::Logger::info("QMARK Server started successfully");

            // Boucle principale
            std::cout << "QMARK Server running on http://0.0.0.0:" << port << std::endl;
            std::cout << "Press Ctrl+C to stop..." << std::endl;

            // Attendre l'arrêt
            server->waitForStop();
        } else {
            QMark::Logger::error("Failed to start server");
            return 1;
        }

    } catch (const std::exception& e) {
        QMark::Logger::error("Fatal error: " + std::string(e.what()));
        std::cerr << "Fatal error: " << e.what() << std::endl;
        return 1;
    }

    QMark::Logger::info("QMARK Server shutdown complete");
    return 0;
}