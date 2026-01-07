# ARCHON Compact Federation - R Intelligence Layer
# Version: 2.5.1
# Purpose: Statistical analysis and visualization of telemetry data

library(RSQLite)
library(ggplot2)
library(dplyr)
library(jsonlite)

# Configuration
MEMORY_DB <- "../telemetry/memory_store.sqlite"
OUTPUT_DIR <- "../reports/"

#' Connect to memory store
connect_memory <- function() {
  if (!file.exists(MEMORY_DB)) {
    stop("Memory store not found: ", MEMORY_DB)
  }
  dbConnect(SQLite(), MEMORY_DB)
}

#' Analyze build performance
analyze_builds <- function(days = 30) {
  conn <- connect_memory()
  on.exit(dbDisconnect(conn))
  
  query <- sprintf("
    SELECT 
      date(timestamp) as build_date,
      COUNT(*) as total_builds,
      SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as successful,
      AVG(latency_ms) as avg_latency,
      SUM(cost_usd) as total_cost
    FROM telemetry 
    WHERE timestamp >= date('now', '-%d days')
    GROUP BY date(timestamp)
    ORDER BY build_date
  ", days)
  
  tryCatch({
    result <- dbGetQuery(conn, query)
    result$success_rate <- result$successful / result$total_builds
    return(result)
  }, error = function(e) {
    message("Query error: ", e$message)
    return(data.frame())
  })
}

#' Analyze AI model performance
analyze_ai_performance <- function() {
  conn <- connect_memory()
  on.exit(dbDisconnect(conn))
  
  query <- "
    SELECT 
      ai_id,
      weight as trust_weight,
      updated_at
    FROM ai_weights
    ORDER BY weight DESC
  "
  
  tryCatch({
    dbGetQuery(conn, query)
  }, error = function(e) {
    message("AI weights query error: ", e$message)
    data.frame(ai_id = c("gpt4o", "claude", "gemini", "deepseek", "gpt5"),
               trust_weight = c(0.30, 0.20, 0.20, 0.15, 0.15))
  })
}

#' Generate performance visualization
generate_performance_chart <- function(data, output_file = "performance.png") {
  if (nrow(data) == 0) {
    message("No data to visualize")
    return(NULL)
  }
  
  p <- ggplot(data, aes(x = as.Date(build_date))) +
    geom_line(aes(y = success_rate * 100, color = "Success Rate"), size = 1.2) +
    geom_line(aes(y = avg_latency / 100, color = "Latency (scaled)"), size = 1) +
    labs(
      title = "ARCHON Build Performance",
      subtitle = "Success Rate & Latency Trends",
      x = "Date",
      y = "Value",
      color = "Metric"
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(face = "bold", size = 14),
      legend.position = "bottom"
    ) +
    scale_color_manual(values = c("Success Rate" = "#10B981", "Latency (scaled)" = "#F59E0B"))
  
  ggsave(file.path(OUTPUT_DIR, output_file), p, width = 10, height = 6, dpi = 150)
  message("Chart saved: ", output_file)
  return(p)
}

#' Generate AI weights chart
generate_ai_weights_chart <- function(output_file = "ai_weights.png") {
  data <- analyze_ai_performance()
  
  if (nrow(data) == 0) return(NULL)
  
  p <- ggplot(data, aes(x = reorder(ai_id, trust_weight), y = trust_weight, fill = ai_id)) +
    geom_bar(stat = "identity", width = 0.7) +
    coord_flip() +
    labs(
      title = "ARCHON AI Model Trust Weights",
      x = "AI Model",
      y = "Trust Weight"
    ) +
    theme_minimal() +
    theme(legend.position = "none") +
    scale_fill_brewer(palette = "Set2")
  
  ggsave(file.path(OUTPUT_DIR, output_file), p, width = 8, height = 5, dpi = 150)
  message("Chart saved: ", output_file)
  return(p)
}

#' Calculate optimization recommendations
calculate_recommendations <- function() {
  builds <- analyze_builds(7)
  ai_perf <- analyze_ai_performance()
  
  if (nrow(builds) == 0) {
    return(list(
      status = "insufficient_data",
      message = "Not enough telemetry data for recommendations"
    ))
  }
  
  avg_success <- mean(builds$success_rate, na.rm = TRUE)
  avg_latency <- mean(builds$avg_latency, na.rm = TRUE)
  total_cost <- sum(builds$total_cost, na.rm = TRUE)
  
  recommendations <- list(
    status = "ready",
    period = "last_7_days",
    metrics = list(
      avg_success_rate = round(avg_success, 4),
      avg_latency_ms = round(avg_latency, 2),
      total_cost_usd = round(total_cost, 4)
    ),
    recommendations = c()
  )
  
  # Generate recommendations
  if (avg_success < 0.8) {
    recommendations$recommendations <- c(recommendations$recommendations,
      "Increase trust threshold to filter low-quality plans")
  }
  if (avg_latency > 5000) {
    recommendations$recommendations <- c(recommendations$recommendations,
      "Consider caching or parallel processing to reduce latency")
  }
  if (total_cost > 10) {
    recommendations$recommendations <- c(recommendations$recommendations,
      "Review token usage - consider model optimization")
  }
  
  if (length(recommendations$recommendations) == 0) {
    recommendations$recommendations <- c("System performing optimally - no changes recommended")
  }
  
  return(recommendations)
}

#' Generate weekly report
generate_weekly_report <- function() {
  report <- list(
    generated_at = Sys.time(),
    version = "2.5.1",
    layer = "R Intelligence",
    build_analysis = analyze_builds(7),
    ai_performance = analyze_ai_performance(),
    recommendations = calculate_recommendations()
  )
  
  # Save as JSON
  output_file <- file.path(OUTPUT_DIR, "weekly_report.json")
  write_json(report, output_file, pretty = TRUE, auto_unbox = TRUE)
  message("Weekly report saved: ", output_file)
  
  return(report)
}

# Main execution
main <- function() {
  message("="*60)
  message("ARCHON R Intelligence Layer - Weekly Analysis")
  message("="*60)
  
  # Ensure output directory exists
  if (!dir.exists(OUTPUT_DIR)) {
    dir.create(OUTPUT_DIR, recursive = TRUE)
  }
  
  # Generate analysis
  tryCatch({
    builds <- analyze_builds(30)
    message(sprintf("Analyzed %d days of build data", nrow(builds)))
    
    if (nrow(builds) > 0) {
      generate_performance_chart(builds)
    }
    
    generate_ai_weights_chart()
    
    report <- generate_weekly_report()
    message("\nRecommendations:")
    for (rec in report$recommendations$recommendations) {
      message("  - ", rec)
    }
    
    message("\n✅ R Intelligence analysis complete")
  }, error = function(e) {
    message("❌ Analysis error: ", e$message)
  })
}

# Run if executed directly
if (!interactive()) {
  main()
}
