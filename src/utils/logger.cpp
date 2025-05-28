
#include "utils/logger.hpp"
#include <iostream>
#include <fstream>
#include <filesystem>
#include <iomanip>
#include <sstream>

namespace QMark {

Logger& Logger::getInstance() {
    static Logger instance;
    return instance;
}

Logger::Logger() : log_level_(LogLevel::INFO) {}

void Logger::init(const std::string& log_file) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Create logs directory if it doesn't exist
    std::filesystem::path log_path(log_file);
    std::filesystem::create_directories(log_path.parent_path());
    
    log_file_ = log_file;
    initialized_ = true;
    
    log(LogLevel::INFO, "Logger initialized with file: " + log_file);
}

void Logger::setLogLevel(LogLevel level) {
    std::lock_guard<std::mutex> lock(mutex_);
    log_level_ = level;
}

void Logger::log(LogLevel level, const std::string& message) {
    if (level < log_level_) {
        return;
    }
    
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    ss << '.' << std::setfill('0') << std::setw(3) << ms.count();
    
    std::string timestamp = ss.str();
    std::string level_str = levelToString(level);
    std::string log_entry = "[" + timestamp + "] [" + level_str + "] " + message;
    
    // Output to console
    if (level >= LogLevel::ERROR) {
        std::cerr << log_entry << std::endl;
    } else {
        std::cout << log_entry << std::endl;
    }
    
    // Output to file if initialized
    if (initialized_ && !log_file_.empty()) {
        std::ofstream file(log_file_, std::ios::app);
        if (file.is_open()) {
            file << log_entry << std::endl;
        }
    }
}

std::string Logger::levelToString(LogLevel level) {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO:  return "INFO ";
        case LogLevel::WARN:  return "WARN ";
        case LogLevel::ERROR: return "ERROR";
        default: return "UNKNOWN";
    }
}

void Logger::debug(const std::string& message) {
    getInstance().log(LogLevel::DEBUG, message);
}

void Logger::info(const std::string& message) {
    getInstance().log(LogLevel::INFO, message);
}

void Logger::warn(const std::string& message) {
    getInstance().log(LogLevel::WARN, message);
}

void Logger::error(const std::string& message) {
    getInstance().log(LogLevel::ERROR, message);
}

} // namespace QMark
