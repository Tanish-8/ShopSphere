import React from "react";

function formatAt(at) {
  if (!at) return "";
  try {
    return new Date(at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export default function OrderTimeline({ statusHistory = [], orderTimeline = [], currentStatus }) {
  const source = Array.isArray(orderTimeline) && orderTimeline.length > 0
    ? orderTimeline.map(e => ({ status: e.status, at: e.updatedAt, note: e.note }))
    : statusHistory;

  // Sort timeline steps chronologically
  const timelineItems = [...source].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-6 text-left">
      {timelineItems.map((item, index) => {
        const isLast = index === timelineItems.length - 1;
        return (
          <li key={item._id || index} className="ml-6 relative">
            <span className={`absolute -left-9 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-8 ring-white ${isLast ? "bg-indigo-600 text-white font-bold" : "bg-green-500 text-white"}`}>
              {isLast ? "●" : "✓"}
            </span>
            <div className="flex flex-col">
              <h4 className="text-xs font-extrabold text-gray-900 capitalize">{item.status}</h4>
              <time className="text-[10px] text-gray-500 font-semibold mt-0.5">{formatAt(item.at)}</time>
              {item.note && (
                <p className="text-[10px] text-gray-400 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-150 font-medium">
                  {item.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
