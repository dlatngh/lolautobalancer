import {
  QueueCategory,
  QUEUE_CATEGORIES,
  QUEUE_CATEGORY_LABELS,
} from "@/lib/roleBalance/queueWeights";

interface QueueSelectorProps {
  selected: QueueCategory[];
  onToggle: (category: QueueCategory) => void;
}

export default function QueueSelector({ selected, onToggle }: QueueSelectorProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <p className="font-beaufort uppercase text-[#A09B8C] text-sm tracking-widest">
        Queues considered
      </p>
      <div className="flex flex-row flex-wrap items-center justify-center gap-y-2">
        {QUEUE_CATEGORIES.map((category) => {
          const isSelected = selected.includes(category);
          return (
            <label
              key={category}
              className="flex flex-row items-center justify-center space-x-2 w-48 cursor-pointer font-spiegel text-[#F0E6D2]"
            >
              <input
                type="checkbox"
                className="accent-[#C89B3C] h-4 w-4 cursor-pointer shrink-0"
                checked={isSelected}
                onChange={() => onToggle(category)}
              />
              <span>{QUEUE_CATEGORY_LABELS[category]}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
