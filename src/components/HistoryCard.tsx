"use client";

import Image from "next/image";
import { useState } from "react";

interface HistoryItem {
  id: string;
  created_at: string;
  score_summary?: {
    pore?: number;
    wrinkle?: number;
    acne?: number;
    dark_spot?: number;
    texture?: number;
    redness?: number;
  };
  image_path?: string;
}

interface HistoryCardProps {
  item: HistoryItem;
  onView?: (id: string) => void;
}

export default function HistoryCard({ item, onView }: HistoryCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Bagus";
    if (score >= 60) return "Sedang";
    return "Perlu Perhatian";
  };

  // Calculate average score
  const scores = item.score_summary;
  const avgScore = scores
    ? Math.round(
        Object.values(scores).reduce((sum, val) => sum + (val || 0), 0) /
          Object.keys(scores).length
      )
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-100">
        {item.image_path && !imageError ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v2/history/${item.id}/image?type=original`}
            alt="Analysis"
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">
            {formatDate(item.created_at)}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(
              avgScore
            )}`}
          >
            {getScoreLabel(avgScore)} ({avgScore})
          </span>
        </div>

        {scores && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(scores).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">
                  {key.replace("_", " ")}:
                </span>
                <span className="font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onView?.(item.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Lihat Detail
        </button>
      </div>
    </div>
  );
}
