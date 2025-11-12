import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

const TutorialsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px 24px 48px;
  width: 100%;
  height: calc(100vh - 80px);
  overflow-y: auto;
  background: ${({ theme }) => theme.bgLight};
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
`;

const SearchBar = styled.form`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 240px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "60"};
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text_primary};
  font-size: 16px;
  outline: none;
  transition: border 0.2s ease;

  &:focus {
    border: 1px solid ${({ theme }) => theme.primary};
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 2fr) minmax(280px, 1fr);
  gap: 24px;

  @media screen and (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const PlayerSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 20px;
  box-shadow: 0 12px 40px ${({ theme }) => theme.shadow};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 420px;
`;

const PlayerFrame = styled.iframe`
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: 16px;
  background: ${({ theme }) => theme.black};
`;

const Placeholder = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  background: ${({ theme }) => theme.black + "10"};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text_secondary};
  font-weight: 500;
`;

const VideoTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.text_primary};
`;

const VideoMeta = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.text_secondary};
`;

const VideosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 620px;
  overflow-y: auto;
  padding-right: 6px;
`;

const VideoCard = styled.button`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  padding: 12px;
  border: 1px solid ${({ theme, active }) =>
    active ? theme.primary : theme.text_secondary + "40"};
  border-radius: 16px;
  background: ${({ theme, active }) =>
    active ? theme.primary + "10" : theme.card};
  cursor: pointer;
  transition: transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease;
  text-align: left;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px ${({ theme }) => theme.shadow};
  }

  @media screen and (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
`;

const VideoInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.red + "15"};
  color: ${({ theme }) => theme.red};
  font-weight: 500;
`;

const EmptyState = styled.div`
  padding: 32px;
  border-radius: 16px;
  background: ${({ theme }) => theme.card};
  text-align: center;
  color: ${({ theme }) => theme.text_secondary};
`;

const LoadingText = styled.span`
  color: ${({ theme }) => theme.text_secondary};
  font-weight: 500;
`;

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const DEFAULT_SEARCH = "workout tutorials";

const Tutorials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = useMemo(
    () => process.env.REACT_APP_YOUTUBE_API_KEY?.trim(),
    []
  );

  const ensureWorkoutQuery = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return DEFAULT_SEARCH;
    return trimmed.toLowerCase().includes("workout")
      ? trimmed
      : `${trimmed} workout`;
  }, []);

  const fetchVideos = useCallback(
    async (term) => {
      if (!apiKey) {
        setError(
          "Missing YouTube API key. Set REACT_APP_YOUTUBE_API_KEY in your client environment."
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${YOUTUBE_SEARCH_URL}?key=${apiKey}&q=${encodeURIComponent(
            ensureWorkoutQuery(term)
          )}&part=snippet&type=video&maxResults=12&videoEmbeddable=true&safeSearch=strict`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }

        const data = await response.json();
        const parsedVideos = Array.isArray(data.items)
          ? data.items.filter((item) => item.id?.videoId)
          : [];

        setVideos(parsedVideos);
        setSelectedVideo(
          parsedVideos.length > 0
            ? parsedVideos[0]
            : null
        );

        if (parsedVideos.length === 0) {
          setError("No workout videos found for that search. Try another term.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong while fetching videos.");
      } finally {
        setLoading(false);
      }
    },
    [apiKey, ensureWorkoutQuery]
  );

  useEffect(() => {
    fetchVideos(DEFAULT_SEARCH);
  }, [fetchVideos]);

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchVideos(searchTerm);
  };

  return (
    <TutorialsWrapper>
      <Header>
        <Title>Workout Tutorials</Title>
        <Subtitle>
          Search curated workout tutorials from YouTube, discover new routines,
          and play them without leaving FitTrack.
        </Subtitle>
        <SearchBar onSubmit={handleSubmit}>
          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search for a workout (e.g. HIIT, yoga, strength)..."
          />
          <SearchButton type="submit" disabled={loading || !apiKey}>
            {loading ? "Searching..." : "Search"}
          </SearchButton>
        </SearchBar>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!apiKey && (
          <ErrorBanner>
            To enable YouTube tutorials locally, add your API key to an
            environment file:
            <br />
            <code>REACT_APP_YOUTUBE_API_KEY=your-key</code>
          </ErrorBanner>
        )}
      </Header>

      <Content>
        <PlayerSection>
          {selectedVideo ? (
            <>
              <PlayerFrame
                src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}`}
                title={selectedVideo.snippet?.title || "Workout tutorial"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <VideoTitle>{selectedVideo.snippet?.title}</VideoTitle>
              <VideoMeta>
                {selectedVideo.snippet?.channelTitle && (
                  <>
                    {selectedVideo.snippet.channelTitle}
                    {" • "}
                  </>
                )}
                {selectedVideo.snippet?.publishedAt
                  ? new Date(
                      selectedVideo.snippet.publishedAt
                    ).toLocaleDateString()
                  : null}
              </VideoMeta>
              {selectedVideo.snippet?.description && (
                <VideoMeta>{selectedVideo.snippet.description}</VideoMeta>
              )}
            </>
          ) : (
            <Placeholder>
              {loading ? <LoadingText>Loading tutorials…</LoadingText> : "Select a workout to start watching"}
            </Placeholder>
          )}
        </PlayerSection>

        <VideosList>
          {loading && videos.length === 0 ? (
            <EmptyState>
              <LoadingText>Fetching the latest workout tutorials…</LoadingText>
            </EmptyState>
          ) : videos.length === 0 ? (
            <EmptyState>
              No workout tutorials found. Try a different search keyword.
            </EmptyState>
          ) : (
            videos.map((video) => (
              <VideoCard
                key={video.id.videoId}
                type="button"
                onClick={() => setSelectedVideo(video)}
                active={selectedVideo?.id?.videoId === video.id.videoId}
              >
                <Thumbnail
                  src={video.snippet?.thumbnails?.medium?.url}
                  alt={video.snippet?.title || "Workout tutorial thumbnail"}
                  loading="lazy"
                />
                <VideoInfo>
                  <VideoTitle as="h3">{video.snippet?.title}</VideoTitle>
                  <VideoMeta>{video.snippet?.channelTitle}</VideoMeta>
                </VideoInfo>
              </VideoCard>
            ))
          )}
        </VideosList>
      </Content>
    </TutorialsWrapper>
  );
};

export default Tutorials;

