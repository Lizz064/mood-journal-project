CREATE DATABASE IF NOT EXISTS mood_journal;
USE mood_journal;

CREATE TABLE IF NOT EXISTS entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mood VARCHAR(50) NOT NULL,
    note TEXT NOT NULL,
    sentiment_label VARCHAR(50),
    sentiment_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
