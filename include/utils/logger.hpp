
#pragma once

#include <string>
#include <fstream>
#include <memory>
#include <mutex>
#include <sstream>
#include <chrono>
#include <thread>
#include <queue>
#include <condition_variable>

namespace qmark::utils {
    
    enum class LogLevel {
        TRACE = 0,
        DEBUG = 1,
        INFO = 2,
        WARN = 3,
        ERROR = 4,
        FATAL = 5
    };
    
    struct LogEntry {
        LogLevel level;
        std::chrono::system_clock::time_point timestamp;
        std::thread::id thread_id;
        std::string file;
        int line;
        std::string function;
        std::string message;
    };
    
    class Logger {
    private:
        LogLevel min_level_;
        bool console_output_;
        bool file_output_;
        std::string log_file_path_;
        std::unique_ptr<std::ofstream> file_stream_;
        mutable std::mutex log_mutex_;
        
        // Threading pour logging asynchrone
        std::thread worker_thread_;
        std::queue<LogEntry> log_queue_;
        std::mutex queue_mutex_;
        std::condition_variable queue_cv_;
        std::atomic<bool> should_stop_;
        
        // Méthodes privées
        void worker_loop();
        void write_entry(const LogEntry& entry);
        std::string format_entry(const LogEntry& entry);
        std::string level_to_string(LogLevel level);
        std::string format_timestamp(const std::chrono::system_clock::time_point& tp);
        
    public:
        Logger();
        explicit Logger(LogLevel min_level);
        ~Logger();
        
        // Configuration
        void set_min_level(LogLevel level);
        LogLevel get_min_level() const;
        void enable_console_output(bool enable = true);
        void enable_file_output(const std::string& file_path);
        void disable_file_output();
        
        // Logging principal
        void log(LogLevel level, 
                const std::string& file,
                int line,
                const std::string& function,
                const std::string& message);
        
        template<typename... Args>
        void log_formatted(LogLevel level,
                          const std::string& file,
                          int line, 
                          const std::string& function,
                          const std::string& format,
                          Args&&... args) {
            if (level < min_level_) return;
            
            std::ostringstream oss;
            format_message(oss, format, std::forward<Args>(args)...);
            log(level, file, line, function, oss.str());
        }
        
        // Méthodes de convenance
        void trace(const std::string& message);
        void debug(const std::string& message);
        void info(const std::string& message);
        void warn(const std::string& message);
        void error(const std::string& message);
        void fatal(const std::string& message);
        
        // Contrôle
        void flush();
        void shutdown();
        
    private:
        template<typename T>
        void format_message(std::ostringstream& oss, const std::string& format, T&& value) {
            size_t pos = format.find("{}");
            if (pos != std::string::npos) {
                oss << format.substr(0, pos) << std::forward<T>(value) << format.substr(pos + 2);
            } else {
                oss << format;
            }
        }
        
        template<typename T, typename... Args>
        void format_message(std::ostringstream& oss, const std::string& format, T&& value, Args&&... args) {
            size_t pos = format.find("{}");
            if (pos != std::string::npos) {
                std::string remaining = format.substr(0, pos) + std::to_string(value) + format.substr(pos + 2);
                format_message(oss, remaining, std::forward<Args>(args)...);
            } else {
                oss << format;
            }
        }
    };
    
    // Singleton global
    class GlobalLogger {
    private:
        static std::unique_ptr<Logger> instance_;
        static std::mutex instance_mutex_;
        
    public:
        static Logger& get_instance();
        static void initialize(LogLevel min_level = LogLevel::INFO, 
                             bool console = true,
                             const std::string& file_path = "");
        static void shutdown();
    };
}

// Macros pour faciliter l'utilisation
#define LOG_TRACE(msg) qmark::utils::GlobalLogger::get_instance().log(qmark::utils::LogLevel::TRACE, __FILE__, __LINE__, __FUNCTION__, msg)
#define LOG_DEBUG(msg) qmark::utils::GlobalLogger::get_instance().log(qmark::utils::LogLevel::DEBUG, __FILE__, __LINE__, __FUNCTION__, msg)
#define LOG_INFO(msg) qmark::utils::GlobalLogger::get_instance().log(qmark::utils::LogLevel::INFO, __FILE__, __LINE__, __FUNCTION__, msg)
#define LOG_WARN(msg) qmark::utils::GlobalLogger::get_instance().log(qmark::utils::LogLevel::WARN, __FILE__, __LINE__, __FUNCTION__, msg)
#define LOG_ERROR(msg) qmark::utils::GlobalLogger::get_instance().log(qmark::utils::LogLevel::ERROR, __FILE__, __LINE__, __FUNCTION__, msg)
#define LOG_FATAL(msg) qmark::utils::GlobalLogger::get_instance().log(qmark::utils::LogLevel::FATAL, __FILE__, __LINE__, __FUNCTION__, msg)

#define LOG_TRACE_F(fmt, ...) qmark::utils::GlobalLogger::get_instance().log_formatted(qmark::utils::LogLevel::TRACE, __FILE__, __LINE__, __FUNCTION__, fmt, __VA_ARGS__)
#define LOG_DEBUG_F(fmt, ...) qmark::utils::GlobalLogger::get_instance().log_formatted(qmark::utils::LogLevel::DEBUG, __FILE__, __LINE__, __FUNCTION__, fmt, __VA_ARGS__)
#define LOG_INFO_F(fmt, ...) qmark::utils::GlobalLogger::get_instance().log_formatted(qmark::utils::LogLevel::INFO, __FILE__, __LINE__, __FUNCTION__, fmt, __VA_ARGS__)
#define LOG_WARN_F(fmt, ...) qmark::utils::GlobalLogger::get_instance().log_formatted(qmark::utils::LogLevel::WARN, __FILE__, __LINE__, __FUNCTION__, fmt, __VA_ARGS__)
#define LOG_ERROR_F(fmt, ...) qmark::utils::GlobalLogger::get_instance().log_formatted(qmark::utils::LogLevel::ERROR, __FILE__, __LINE__, __FUNCTION__, fmt, __VA_ARGS__)
#define LOG_FATAL_F(fmt, ...) qmark::utils::GlobalLogger::get_instance().log_formatted(qmark::utils::LogLevel::FATAL, __FILE__, __LINE__, __FUNCTION__, fmt, __VA_ARGS__)
