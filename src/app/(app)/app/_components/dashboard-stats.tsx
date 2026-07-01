"use client";

import { motion } from "motion/react";
import { Star, MessageSquare, Reply, TrendingUp } from "lucide-react";
import { StatCard } from "@/shared/ui/patterns/stat-card";
import { staggerContainer } from "@/shared/motion/variants";

export interface DashboardMetrics {
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  newThisWeek: number;
  deltas: { rating: number; reviews: number; response: number; week: number };
}

export function DashboardStats({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <motion.div
      variants={staggerContainer(0.06)}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        label="Average rating"
        value={metrics.avgRating.toFixed(1)}
        delta={metrics.deltas.rating}
        icon={<Star />}
        suffix={<Star className="mb-1 size-5 fill-star text-star" />}
      />
      <StatCard label="Total reviews" value={metrics.totalReviews} delta={metrics.deltas.reviews} icon={<MessageSquare />} />
      <StatCard label="Response rate" value={`${metrics.responseRate}%`} delta={metrics.deltas.response} icon={<Reply />} />
      <StatCard label="New this week" value={metrics.newThisWeek} delta={metrics.deltas.week} icon={<TrendingUp />} />
    </motion.div>
  );
}
