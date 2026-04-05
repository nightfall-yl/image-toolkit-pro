import { App, TFile } from "obsidian";

type LinkType = "markdown" | "wiki" | "wikiTransclusion" | "mdTransclusion";

export interface LinkMatch {
  type: LinkType;
  match: string;
  linkText: string;
  sourceFilePath: string;
}

export const getAllLinkMatchesInFile = async (
  mdFile: TFile,
  app: App,
  fileText?: string
): Promise<LinkMatch[]> => {
  const linkMatches: LinkMatch[] = [];
  const content = fileText ?? (await app.vault.read(mdFile));

  const wikiRegex = /\[\[.*?\]\]/g;
  const wikiMatches = content.match(wikiRegex);
  if (wikiMatches) {
    const fileRegex = /(?<=\[\[).*?(?=(\]|\|))/;

    for (const wikiMatch of wikiMatches) {
      if (matchIsWikiTransclusion(wikiMatch)) {
        const fileName = getTransclusionFileName(wikiMatch);
        const file = app.metadataCache.getFirstLinkpathDest(fileName, mdFile.path);
        if (fileName !== "") {
          linkMatches.push({
            type: "wikiTransclusion",
            match: wikiMatch,
            linkText: file ? file.path : fileName,
            sourceFilePath: mdFile.path,
          });
          continue;
        }
      }

      const fileMatch = wikiMatch.match(fileRegex);
      if (fileMatch) {
        if (fileMatch[0].startsWith("http")) {
          continue;
        }

        const file = app.metadataCache.getFirstLinkpathDest(fileMatch[0], mdFile.path);
        linkMatches.push({
          type: "wiki",
          match: wikiMatch,
          linkText: file ? file.path : fileMatch[0],
          sourceFilePath: mdFile.path,
        });
      }
    }
  }

  const markdownRegex = /\[(^$|.*?)\]\((.*?)\)/g;
  const markdownMatches = content.match(markdownRegex);
  if (markdownMatches) {
    const fileRegex = /(?<=\().*(?=\))/;

    for (const markdownMatch of markdownMatches) {
      if (matchIsMdTransclusion(markdownMatch)) {
        const fileName = getTransclusionFileName(markdownMatch);
        const file = app.metadataCache.getFirstLinkpathDest(fileName, mdFile.path);
        if (fileName !== "") {
          linkMatches.push({
            type: "mdTransclusion",
            match: markdownMatch,
            linkText: file ? file.path : fileName,
            sourceFilePath: mdFile.path,
          });
          continue;
        }
      }

      const fileMatch = markdownMatch.match(fileRegex);
      if (fileMatch) {
        if (fileMatch[0].startsWith("http")) {
          continue;
        }

        const file = app.metadataCache.getFirstLinkpathDest(fileMatch[0], mdFile.path);
        linkMatches.push({
          type: "markdown",
          match: markdownMatch,
          linkText: file ? file.path : fileMatch[0],
          sourceFilePath: mdFile.path,
        });
      }
    }
  }

  return linkMatches;
};

const wikiTransclusionRegex = /\[\[(.*?)#.*?\]\]/;
const wikiTransclusionFileNameRegex = /(?<=\[\[)(.*)(?=#)/;

const mdTransclusionRegex = /\[.*?]\((.*?)#.*?\)/;
const mdTransclusionFileNameRegex = /(?<=\]\()(.*)(?=#)/;

const matchIsWikiTransclusion = (match: string): boolean => {
  return wikiTransclusionRegex.test(match);
};

const matchIsMdTransclusion = (match: string): boolean => {
  return mdTransclusionRegex.test(match);
};

const getTransclusionFileName = (match: string): string => {
  const isWiki = wikiTransclusionRegex.test(match);
  const isMd = mdTransclusionRegex.test(match);
  if (isWiki || isMd) {
    const fileNameMatch = match.match(isWiki ? wikiTransclusionFileNameRegex : mdTransclusionFileNameRegex);
    if (fileNameMatch) {
      return fileNameMatch[0];
    }
  }

  return "";
};
