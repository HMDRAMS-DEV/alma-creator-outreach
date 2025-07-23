'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Creator } from '@/types/creator';

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const response = await fetch('/api/creators');
        if (!response.ok) {
          throw new Error('Failed to fetch creators');
        }
        const data = await response.json();
        setCreators(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreators();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="border-b pb-5">
        <h1 className="text-3xl font-bold">Saved Creators</h1>
        <p className="text-muted-foreground mt-2">
          A list of creators you have saved from your discovery sessions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator List</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading creators...' : `You have ${creators.length} saved creators.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : creators.length === 0 ? (
            <p>You haven't saved any creators yet. Go to the Discovery tab to find some!</p>
          ) : (
            <div className="space-y-3">
              {creators.map((creator) => (
                <div key={`${creator.platform}-${creator.username}`} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <a
                      href={`https://www.${creator.platform}.com/${creator.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      @{creator.username}
                    </a>
                    <p className="text-sm text-muted-foreground">
                      Platform: {creator.platform} • Score: {creator.score ? `${Math.round(creator.score.overall * 100)}%` : 'N/A'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/conversations/${creator.username}`}>View Conversation</a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
