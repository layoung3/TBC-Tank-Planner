import { buildTabOptions } from "../config/plannerOptions";
import type { BuildTab } from "../models/plannerModels";

interface BuildTabsProps {
  activeTab: BuildTab;
  onTabChange: (tab: BuildTab) => void;
}

export function BuildTabs({ activeTab, onTabChange }: BuildTabsProps) {
  return (
    <div className="build-tabs">
      {buildTabOptions.map((tab) => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? "active" : ""}
          disabled={tab.isDisabled}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
