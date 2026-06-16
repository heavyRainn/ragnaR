"use client";

import type { MarketStory, MarketStoryItem } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";

interface MarketStoryBlockProps {
  story: MarketStory;
}

const STORY_KEYS = [
  "capitalRotating",
  "capitalInto",
  "sectorSignalsHour",
  "sectorScoreDelta",
  "mostActiveSector",
  "marketQuiet",
] as const;

type StoryKey = (typeof STORY_KEYS)[number];

function isStoryKey(key: string): key is StoryKey {
  return (STORY_KEYS as readonly string[]).includes(key);
}

function renderStoryLine(
  t: (key: string, vars?: Record<string, string | number>) => string,
  localizeStoryParams: (params: Record<string, string | number>) => Record<string, string | number>,
  translateMarketNarrative: (text: string) => string,
  item: MarketStoryItem
): string {
  if (!isStoryKey(item.key)) return item.key;
  const fullKey = `marketStory.${item.key}`;
  const params = item.params as Record<string, string | number>;

  if (item.key === "marketQuiet" && typeof params.narrative === "string") {
    return t(fullKey, {
      narrative: translateMarketNarrative(params.narrative),
    });
  }

  return t(fullKey, localizeStoryParams(params));
}

export function MarketStoryBlock({ story }: MarketStoryBlockProps) {
  const { t, localizeStoryParams, translateMarketNarrative } = useI18n();

  const headlineKey = isStoryKey(story.headline_key)
    ? `marketStory.${story.headline_key}`
    : "marketStory.whereIsCapital";

  return (
    <section className="mb-8">
      <h2 className="section-label mb-2">{t("marketStory.title")}</h2>
      <p className="mb-4 font-mono text-lg font-semibold text-cmc-text sm:text-xl">
        {t(headlineKey)}
      </p>
      <Card className="border-terminal-blue/25 bg-terminal-blue/[0.04]">
        <CardContent className="space-y-3 py-5">
          {story.stories.length === 0 ? (
            <p className="text-sm text-cmc-muted">{t("radar.noActiveEvents")}</p>
          ) : (
            story.stories.map((item, index) => (
              <p
                key={`${item.key}-${index}`}
                className="border-l-2 border-terminal-blue/50 pl-4 text-sm leading-relaxed text-cmc-text"
              >
                {renderStoryLine(t, localizeStoryParams, translateMarketNarrative, item)}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
