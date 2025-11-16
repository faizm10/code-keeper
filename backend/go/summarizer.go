package main

// Go backup implementation of Code Keeper's PR file summarization logic.
// This mirrors the behavior of the Next.js/TypeScript version so the
// backend can generate useful summaries even if the web layer is unavailable.

import (
	"fmt"
	"regexp"
	"strings"
)

type GitHubPRFile struct {
	Filename  string `json:"filename"`
	Status    string `json:"status"` // added | modified | removed | renamed
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Changes   int    `json:"changes"`
	Patch     string `json:"patch,omitempty"`
}

type FileSummary struct {
	Path    string `json:"path"`
	Status  string `json:"status"`
	Summary string `json:"summary"`
}

type fileChangeAnalysis struct {
	Description string
	Additions   []string
	Deletions   []string
}

func isPackageLockFile(path string) bool {
	matched, _ := regexp.MatchString(`(?i)package-lock\.json$`, path)
	return matched
}

func summarizePackageLockChanges(file GitHubPRFile) string {
	addedVersions := len(regexp.MustCompile(`(?m)^\+\s+"version":\s*"[^"]+"`).FindAllString(file.Patch, -1))
	removedVersions := len(regexp.MustCompile(`(?m)^-\s+"version":\s*"[^"]+"`).FindAllString(file.Patch, -1))
	bumped := minInt(addedVersions, removedVersions)
	addedOnly := maxInt(0, addedVersions-bumped)
	removedOnly := maxInt(0, removedVersions-bumped)

	statusLabel := statusLabelFor(file.Status)
	return fmt.Sprintf("**%s**: `%s` — package changes (added %d, updated %d, removed %d)",
		statusLabel, file.Filename, addedOnly, bumped, removedOnly)
}

func extractMeaningfulChanges(patch string) fileChangeAnalysis {
	if patch == "" {
		return fileChangeAnalysis{}
	}

	var additions, deletions []string

	for _, line := range strings.Split(patch, "\n") {
		if strings.HasPrefix(line, "+++") || strings.HasPrefix(line, "---") || strings.HasPrefix(line, "@@") {
			continue
		}

		if strings.HasPrefix(line, "+") && strings.TrimSpace(line) != "+" {
			content := strings.TrimSpace(line[1:])
			if content != "" && !strings.HasPrefix(content, "//") && !strings.HasPrefix(content, "#") && !strings.HasPrefix(content, "*") {
				additions = append(additions, content)
			}
		} else if strings.HasPrefix(line, "-") && strings.TrimSpace(line) != "-" {
			content := strings.TrimSpace(line[1:])
			if content != "" && !strings.HasPrefix(content, "//") && !strings.HasPrefix(content, "#") && !strings.HasPrefix(content, "*") {
				deletions = append(deletions, content)
			}
		}
	}

	desc := generateChangeDescription(additions, deletions, patch)
	return fileChangeAnalysis{
		Description: desc,
		Additions:   additions,
		Deletions:   deletions,
	}
}

func generateChangeDescription(additions, deletions []string, fullPatch string) string {
	newFunction := regexp.MustCompile(`^\s*(function|const|let|var)\s+(\w+)\s*[=(]`)
	newClass := regexp.MustCompile(`^\s*class\s+(\w+)`)
	newImport := regexp.MustCompile(`^\s*import\s+.*from`)
	newExport := regexp.MustCompile(`^\s*export\s+(function|const|class|default)`)
	newType := regexp.MustCompile(`^\s*(type|interface)\s+(\w+)`)
	configChange := regexp.MustCompile(`^\s*["']?\w+["']?\s*:`)
	testCase := regexp.MustCompile(`^\s*(it|test|describe)\s*\(`)

	for _, addition := range additions {
		if newFunction.MatchString(addition) {
			match := newFunction.FindStringSubmatch(addition)
			kind := "function"
			if match != nil && match[1] != "function" {
				kind = "method"
			}
			name := ""
			if match != nil {
				name = match[2]
			}
			return fmt.Sprintf("Added %s `%s`", kind, name)
		}
		if newClass.MatchString(addition) {
			match := newClass.FindStringSubmatch(addition)
			name := ""
			if match != nil {
				name = match[1]
			}
			return fmt.Sprintf("Added class `%s`", name)
		}
		if newImport.MatchString(addition) {
			match := regexp.MustCompile(`import\s+(.*)\s+from\s+['"](.*)['"]`).FindStringSubmatch(addition)
			if match != nil {
				return fmt.Sprintf("Imported %s from %s", match[1], match[2])
			}
			return "Added import"
		}
		if newExport.MatchString(addition) {
			return "Added exports"
		}
		if newType.MatchString(addition) {
			match := newType.FindStringSubmatch(addition)
			kind := "type"
			name := ""
			if match != nil {
				kind = match[1]
				name = match[2]
			}
			return fmt.Sprintf("Added %s `%s`", kind, name)
		}
		if testCase.MatchString(addition) {
			return "Added test cases"
		}
		if configChange.MatchString(addition) {
			return "Updated configuration"
		}
	}

	if len(additions) > 0 && len(deletions) > 0 {
		return "Modified implementation"
	}
	if len(additions) > 0 {
		snippet := strings.Join(additions[:minInt(2, len(additions))], " | ")
		return "Added code: " + snippet
	}
	if len(deletions) > 0 {
		return "Removed code"
	}
	if strings.Contains(fullPatch, "Binary file") {
		return "Updated binary content"
	}
	return ""
}

func getChangeMagnitude(additions, deletions int) string {
	total := additions + deletions
	if total == 0 {
		return ""
	}
	if total < 10 {
		return "minor change"
	}
	if total < 50 {
		return "moderate change"
	}
	if total < 200 {
		return "significant change"
	}
	return "major refactor"
}

func statusLabelFor(status string) string {
	switch status {
	case "added":
		return "New"
	case "modified":
		return "Updated"
	case "removed":
		return "Deleted"
	case "renamed":
		return "Renamed"
	default:
		return strings.ToUpper(status)
	}
}

func buildFileSummary(file GitHubPRFile) FileSummary {
	if isPackageLockFile(file.Filename) {
		return FileSummary{
			Path:    file.Filename,
			Status:  file.Status,
			Summary: summarizePackageLockChanges(file),
		}
	}

	analysis := extractMeaningfulChanges(file.Patch)
	statusLabel := statusLabelFor(file.Status)

	var parts []string
	parts = append(parts, fmt.Sprintf("**%s**: `%s`", statusLabel, file.Filename))

	if file.Status != "removed" {
		magnitude := getChangeMagnitude(file.Additions, file.Deletions)
		if magnitude != "" {
			parts = append(parts, fmt.Sprintf("(%s)", magnitude))
		}
	}

	desc := analysis.Description

	if strings.HasPrefix(desc, "Added code:") {
		snippet := strings.TrimPrefix(desc, "Added code: ")
		prefix := ""
		if file.Additions+file.Deletions > 50 {
			prefix = "Introduces new logic. Highlights: "
		}
		parts = append(parts, "— "+prefix+snippet)
	} else if desc != "" {
		parts = append(parts, "— "+desc)
	} else if len(analysis.Additions) > 0 {
		max := minInt(2, len(analysis.Additions))
		snippet := strings.Join(analysis.Additions[:max], " | ")
		parts = append(parts, "— "+snippet)
	} else if strings.Contains(file.Patch, "Binary file") {
		parts = append(parts, "— binary content updated")
	}

	return FileSummary{
		Path:    file.Filename,
		Status:  file.Status,
		Summary: strings.Join(parts, " "),
	}
}

func SummarizeFiles(files []GitHubPRFile) []FileSummary {
	result := make([]FileSummary, 0, len(files))
	for _, f := range files {
		result = append(result, buildFileSummary(f))
	}
	return result
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}


