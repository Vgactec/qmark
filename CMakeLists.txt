cmake_minimum_required(VERSION 3.20)
project(QMarkCPP VERSION 1.0.0 LANGUAGES CXX)

# Modern C++ standards
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler optimizations
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -DDEBUG")

# Find required packages
find_package(PkgConfig REQUIRED)
find_package(Threads REQUIRED)

# External dependencies
include(FetchContent)

# HTTP server library - httplib
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.14.3
)

# JSON library - nlohmann/json
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)

# SQLite3 modern wrapper
FetchContent_Declare(
    sqlite_modern_cpp
    GIT_REPOSITORY https://github.com/SqliteModernCpp/sqlite_modern_cpp.git
    GIT_TAG v3.2
)

# JWT library for authentication
FetchContent_Declare(
    jwt-cpp
    GIT_REPOSITORY https://github.com/Thalhammer/jwt-cpp.git
    GIT_TAG v0.7.0
)

# Crypto library
FetchContent_Declare(
    cryptopp
    GIT_REPOSITORY https://github.com/weidai11/cryptopp.git
    GIT_TAG CRYPTOPP_8_9_0
)

FetchContent_MakeAvailable(httplib json sqlite_modern_cpp jwt-cpp)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Source files
set(QMARK_SOURCES
    src/main.cpp
    src/server/http_server.cpp
    src/server/routes.cpp
    src/server/auth_handler.cpp
    src/database/database_manager.cpp
    src/database/models/user.cpp
    src/database/models/lead.cpp
    src/database/models/automation.cpp
    src/security/encryption.cpp
    src/security/oauth_client.cpp
    src/utils/json_helper.cpp
    src/utils/logger.cpp
)

# Create executable
add_executable(qmark-server ${QMARK_SOURCES})

# Link libraries
target_link_libraries(qmark-server
    PRIVATE
    httplib::httplib
    nlohmann_json::nlohmann_json
    jwt-cpp::jwt-cpp
    Threads::Threads
    sqlite3
    ssl
    crypto
    curl
)

# Compiler flags for modern C++
target_compile_options(qmark-server PRIVATE
    -Wall
    -Wextra
    -Wpedantic
    -Werror
    -ffast-math
    -march=native
)

# Install targets
install(TARGETS qmark-server
    RUNTIME DESTINATION bin
)

# Enable testing
enable_testing()
add_subdirectory(tests)