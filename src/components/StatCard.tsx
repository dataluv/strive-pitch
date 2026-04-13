"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedCounter from "./AnimatedCounter";

export default function StatCard({
  value,
  suffix = "",
  prefix = "",
  label,
  sublabel,
  color = "blue",
  delay = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sublabel?: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const colorMap = {
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
    red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  };

  const c = colorMap[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={`stat-card p-6 rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm`}
    >
      <AnimatedCounter
        end={value}
        suffix={suffix}
        prefix={prefix}
        className={`text-5xl font-bold ${c.text} block mb-2`}
      />
      <p className="text-white font-semibold text-lg">{label}</p>
      {sublabel && <p className="text-gray-400 text-sm mt-1">{sublabel}</p>}
    </motion.div>
  );
}
