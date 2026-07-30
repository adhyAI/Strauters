export interface GithubSummary {
  username: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
  topRepos: { name: string; description: string | null; language: string | null; stars: number }[];
  languages: string[];
}

export async function fetchGithubSummary(username: string): Promise<GithubSummary | null> {
  const headers = { Accept: "application/vnd.github+json" };

  const profileRes = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!profileRes.ok) return null;
  const profile = await profileRes.json();

  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
    { headers }
  );
  const repos = reposRes.ok ? await reposRes.json() : [];

  const topRepos = (repos as Array<Record<string, unknown>>)
    .sort((a, b) => (b.stargazers_count as number) - (a.stargazers_count as number))
    .slice(0, 5)
    .map((r) => ({
      name: r.name as string,
      description: (r.description as string) ?? null,
      language: (r.language as string) ?? null,
      stars: r.stargazers_count as number,
    }));

  const languages = Array.from(
    new Set(
      (repos as Array<Record<string, unknown>>)
        .map((r) => r.language as string | null)
        .filter((l): l is string => Boolean(l))
    )
  );

  return {
    username,
    name: profile.name ?? null,
    bio: profile.bio ?? null,
    publicRepos: profile.public_repos ?? 0,
    followers: profile.followers ?? 0,
    topRepos,
    languages,
  };
}
