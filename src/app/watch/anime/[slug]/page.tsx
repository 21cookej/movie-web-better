import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';
import { MediaType } from '@/types';

export const revalidate = 3600;

export default function Page({ params }: { params: { slug: string } }) {
  const id = params.slug.split('-').pop();
  const movieId: string | undefined = params.slug.split('/').pop();
  return (
    <EmbedPlayer
      movieId={movieId}
      mediaType={movieId?.includes('t') ? MediaType.ANIME : undefined}
      url={`https://cinemaos.tech/player/${id}/1/1`}
    />
  );
}
