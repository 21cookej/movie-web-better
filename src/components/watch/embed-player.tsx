'use client';
import React from 'react';
import Loading from '../ui/loading';
import { useRouter } from 'next/navigation';
import { MediaType, type IEpisode, type ISeason, type Show } from '@/types';
import MovieService from '@/services/MovieService';
import { type AxiosResponse } from 'axios';
import Season from '../season';

interface EmbedPlayerProps {
  url: string;
  movieId?: string;
  mediaType?: MediaType;
}

function EmbedPlayer(props: EmbedPlayerProps) {
  const router = useRouter();
  const [seasons, setSeasons] = React.useState<ISeason[] | null>(null);
  const loadingRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (props.mediaType === MediaType.ANIME) {
      return;
    }
    if (iframeRef.current) {
      iframeRef.current.src = props.url;
    }
    const { current } = iframeRef;
    const iframe: HTMLIFrameElement | null = current;
    iframe?.addEventListener('load', handleIframeLoaded);
    return () => {
      iframe?.removeEventListener('load', handleIframeLoaded);
    };
  }, []);

  React.useEffect(() => {
    if (!props.movieId || props.mediaType !== MediaType.ANIME) {
      return;
    }
    void handleAnime(props.movieId);
  }, [props.movieId, props.mediaType]);

  const handleChangeEpisode = (episode: IEpisode): void => {
    const { show_id: id, season_number: season, episode_number: eps } = episode;
    handleSetIframeUrl(`https://cinemaos.tech/player/${id}/${season}/${eps}`);
  };

  const handleAnime = async (movieId: string) => {
    const id = Number(movieId.replace('t-', ''));
    const response: AxiosResponse<Show> = await MovieService.findTvSeries(id);
    const { data } = response;
    if (!data?.seasons?.length) {
      return;
    }
    const filteredSeasons = data.seasons.filter(
      (season: ISeason) => season.season_number,
    );
    const promises = filteredSeasons.map(async (season: ISeason) => {
      return MovieService.getSeasons(id, season.season_number);
    });
    const seasonWithEpisodes = await Promise.all(promises);
    setSeasons(
      seasonWithEpisodes.map((res: AxiosResponse<ISeason>) => res.data),
    );
    handleSetIframeUrl(`https://cinemaos.tech/player/${id}/1/1`);
  };

  const handleSetIframeUrl = (url: string): void => {
    if (!iframeRef.current) {
      return;
    }
    iframeRef.current.src = url;
    const iframe = iframeRef.current;
    iframe.addEventListener('load', handleIframeLoaded);
    if (loadingRef.current) loadingRef.current.style.display = 'flex';
  };

  const handleIframeLoaded = () => {
    if (!iframeRef.current) {
      return;
    }
    const iframe = iframeRef.current;
    iframe.style.opacity = '1';
    iframe.removeEventListener('load', handleIframeLoaded);
    if (loadingRef.current) loadingRef.current.style.display = 'none';
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: '#000',
      }}>
      {seasons && (
        <Season seasons={seasons ?? []} onChangeEpisode={handleChangeEpisode} />
      )}

      {/* Back button — top-right, clear of the CinemaOS server selector */}
      <div className="absolute right-4 top-4 z-[2]">
        <button
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition hover:scale-110 hover:bg-black/80">
          <svg
            stroke="#fff"
            fill="#fff"
            strokeWidth="0"
            viewBox="0 0 16 16"
            height="18px"
            width="18px"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
        </button>
      </div>

      {/* Loading spinner */}
      <div
        ref={loadingRef}
        className="absolute z-[1] flex h-full w-full items-center justify-center">
        <Loading />
      </div>

      <iframe
        width="100%"
        height="100%"
        allowFullScreen
        ref={iframeRef}
        style={{ opacity: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
        allow="encrypted-media; autoplay; fullscreen; picture-in-picture"
        // Allows the player to work but blocks it from opening new tabs/popups
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
      />
    </div>
  );
}

export default EmbedPlayer;
