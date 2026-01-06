#!/usr/bin/env Rscript
# ARCHON R Intelligence Layer
# Version: 2.5.1
# Purpose: Statistical analysis and visualization of telemetry data

library(DBI)
library(RSQLite)
library(jsonlite)
library(ggplot2)

# ================================
# DATABASE CONNECTION
# ================================

connect_db <- function(db_path = "../telemetry/memory_store.sqlite") {
  con <- dbConnect(RSQLite::SQLite(), db_path)
  return(con)
}

# ================================
# TELEMETRY ANALYSIS
# ================================

analyze_build_performance <- function(con, days = 30) {
  query <- sprintf("
    SELECT 
      date(timestamp) as build_date,
      COUNT(*) as total_builds,
      SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as success_count,
      AVG(latency_ms) as avg_latency,
      SUM(cost_usd) as total_cost
    FROM telemetry
    WHERE timestamp >= date('now', '-%d days')
    GROUP BY date(timestamp)
    ORDER BY build_date
  ", days)
  
  result <- dbGetQuery(con, query)
  result$success_rate <- result$success_count / result$total_builds
  
  return(result)
}

analyze_ai_performance <- function(con) {
  query <- "
    SELECT 
      ai_id,
      COUNT(*) as total_decisions,
      AVG(trust_score) as avg_trust,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvals
    FROM decisions
    GROUP BY ai_id
  "
  
  result <- tryCatch({
    dbGetQuery(con, query)
  }, error = function(e) {
    data.frame(ai_id = character(), total_decisions = numeric(), 
               avg_trust = numeric(), approvals = numeric())
  })
  
  return(result)
}

# ================================
# WEIGHT OPTIMIZATION
# ================================

calculate_optimal_weights <- function(performance_data) {
  # Bayesian-inspired weight adjustment
  base_weights <- c(
    gpt4o = 0.30,
    claude = 0.20,
    gemini = 0.20,
    deepseek = 0.15,
    gpt5 = 0.15
  )
  
  if (nrow(performance_data) == 0) {
    return(base_weights)
  }
  
  # Calculate performance scores
  scores <- performance_data$avg_trust * (performance_data$approvals / max(1, performance_data$total_decisions))
  names(scores) <- performance_data$ai_id
  
  # Adjust weights based on performance
  new_weights <- base_weights
  for (ai in names(scores)) {
    if (ai %in% names(new_weights)) {
      adjustment <- (scores[ai] - 0.7) * 0.1  # ±10% max adjustment
      new_weights[ai] <- max(0.05, min(0.40, new_weights[ai] + adjustment))
    }
  }
  
  # Normalize to sum to 1
  new_weights <- new_weights / sum(new_weights)
  
  return(new_weights)
}

# ================================
# VISUALIZATION
# ================================

generate_performance_plot <- function(data, output_path = "../reports/performance_trend.png") {
  if (nrow(data) == 0) {
    message("No data to plot")
    return(NULL)
  }
  
  p <- ggplot(data, aes(x = as.Date(build_date))) +
    geom_line(aes(y = success_rate * 100, color = "Success Rate"), size = 1.2) +
    geom_line(aes(y = avg_latency / 100, color = "Latency (scaled)"), size = 1) +
    scale_color_manual(values = c("Success Rate" = "#00ff88", "Latency (scaled)" = "#ff6b6b")) +
    labs(
      title = "ARCHON Build Performance Trend",
      x = "Date",
      y = "Value",
      color = "Metric"
    ) +
    theme_dark() +
    theme(
      plot.background = element_rect(fill = "#1a1a2e"),
      panel.background = element_rect(fill = "#16213e"),
      text = element_text(color = "white"),
      legend.background = element_rect(fill = "#1a1a2e")
    )
  
  ggsave(output_path, p, width = 10, height = 6, dpi = 150)
  message(paste("Plot saved to:", output_path))
  
  return(p)
}

# ================================
# REPORT GENERATION
# ================================

generate_weekly_report <- function(con) {
  build_perf <- analyze_build_performance(con, 7)
  ai_perf <- analyze_ai_performance(con)
  optimal_weights <- calculate_optimal_weights(ai_perf)
  
  report <- list(
    generated_at = Sys.time(),
    period = "weekly",
    build_performance = list(
      total_builds = sum(build_perf$total_builds),
      success_rate = mean(build_perf$success_rate, na.rm = TRUE),
      avg_latency_ms = mean(build_perf$avg_latency, na.rm = TRUE),
      total_cost_usd = sum(build_perf$total_cost, na.rm = TRUE)
    ),
    ai_performance = as.list(ai_perf),
    recommended_weights = as.list(optimal_weights),
    recommendations = generate_recommendations(build_perf, ai_perf)
  )
  
  # Save JSON report
  report_path <- "../reports/weekly_analysis.json"
  write_json(report, report_path, auto_unbox = TRUE, pretty = TRUE)
  message(paste("Report saved to:", report_path))
  
  return(report)
}

generate_recommendations <- function(build_perf, ai_perf) {
  recs <- character()
  
  if (nrow(build_perf) > 0) {
    avg_success <- mean(build_perf$success_rate, na.rm = TRUE)
    if (avg_success < 0.7) {
      recs <- c(recs, "Build success rate below threshold. Review failing builds.")
    }
    
    avg_latency <- mean(build_perf$avg_latency, na.rm = TRUE)
    if (avg_latency > 30000) {
      recs <- c(recs, "High latency detected. Consider optimizing build pipeline.")
    }
  }
  
  if (length(recs) == 0) {
    recs <- c("System performing within normal parameters.")
  }
  
  return(recs)
}

# ================================
# MAIN EXECUTION
# ================================

main <- function() {
  message("🧠 ARCHON R Intelligence Layer Starting...")
  
  con <- tryCatch({
    connect_db()
  }, error = function(e) {
    message("Database connection failed, creating sample analysis...")
    return(NULL)
  })
  
  if (!is.null(con)) {
    report <- generate_weekly_report(con)
    build_data <- analyze_build_performance(con, 30)
    
    if (nrow(build_data) > 0) {
      generate_performance_plot(build_data)
    }
    
    dbDisconnect(con)
    
    message("✅ R Intelligence analysis complete")
    return(report)
  } else {
    message("⚠️ Running in standalone mode")
    return(list(status = "standalone", message = "No database connection"))
  }
}

# Run if executed directly
if (!interactive()) {
  result <- main()
  cat(toJSON(result, auto_unbox = TRUE, pretty = TRUE))
}
