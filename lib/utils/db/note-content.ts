export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function extractBackEnglish(back: string) {
  const withoutAudio = back.replace(/\[sound:[^\]]+\]/gi, " ");
  const highlightedWordMatch = withoutAudio.match(
    /<span\b[^>]*>(.*?)<\/span>/i,
  );
  const highlightedWord = highlightedWordMatch
    ? decodeHtmlEntities(highlightedWordMatch[1].replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim()
    : "";

  const cleaned = decodeHtmlEntities(
    withoutAudio
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r?\n/g, " ")
      .replace(/\s+/g, " "),
  )
    .replace(/^["']+|["']+$/g, "")
    .trim();

  if (!cleaned) {
    return "";
  }

  const quotedEnglishMatches = [...cleaned.matchAll(/["“”]([^"“”]+)["“”]/g)]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));

  if (highlightedWord) {
    const highlightedSentence = quotedEnglishMatches.find((sentence) =>
      sentence.toLowerCase().includes(highlightedWord.toLowerCase()),
    );

    if (highlightedSentence) {
      return highlightedSentence;
    }
  }

  if (quotedEnglishMatches.length > 0) {
    return quotedEnglishMatches[quotedEnglishMatches.length - 1];
  }

  return cleaned;
}

export function buildNoteChecksum(front: string, back: string) {
  return `${front}::${back}`;
}

export function parseNoteContentFromFields(
  sortField?: string,
  checksum?: string,
) {
  const rawFront = sortField?.trim() ?? "";
  const rawChecksum = checksum ?? "";

  if (!rawChecksum) {
    return { front: rawFront, back: "" };
  }

  if (rawFront && rawChecksum.startsWith(`${rawFront}::`)) {
    return {
      front: rawFront,
      back: rawChecksum.slice(rawFront.length + 2),
    };
  }

  const separatorIndex = rawChecksum.indexOf("::");
  if (separatorIndex === -1) {
    return { front: rawFront || rawChecksum, back: "" };
  }

  return {
    front: rawFront || rawChecksum.slice(0, separatorIndex),
    back: rawChecksum.slice(separatorIndex + 2),
  };
}
