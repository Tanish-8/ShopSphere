import React from "react";

function formatAt(at) {
  if (!at) return "";
  try {
    return new Date(at).toLocaleString();
  } catch {
    return "";
  }
}

export default function OrderTimeline({ statusHistory = [], currentStatus, createdAt }) {
  const steps = ["ordered", "processing", "shipped", "delivered"];

  // Map statuses to times from history
  const map = {};
  statusHistory.forEach((e) => {
    if (!map[e.status]) map[e.status] = e;
  });

  // Determine current stage index
  const current = currentStatus || (statusHistory.length ? statusHistory[statusHistory.length - 1].status : "ordered");

  return (
    <ol className="space-y-4">
      {steps.map((s) => {
        const idx = steps.indexOf(s);
        const completed = Boolean(map[s]);
        const isCurrent = s === current;
        return (
          <li key={s} className="flex items-start">
            <div className="flex items-center">
              <div className={`h-6 w-6 flex items-center justify-center rounded-full ${completed ? 'bg-green-500 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {completed ? '✓' : idx === 0 ? '●' : ''}
              </div>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium capitalize text-gray-900">{s}</div>
              <div className="text-xs text-gray-500">
                {map[s] ? formatAt(map[s].at) : isCurrent ? 'In progress' : 'Pending'}
              </div>
              {map[s] && map[s].note ? <div className="text-xs text-gray-600 mt-1">Note: {map[s].note}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
