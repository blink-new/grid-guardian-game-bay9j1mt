import React, { useState, useEffect } from 'react';
import { blink } from '../blink/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { X, Trophy, Star } from 'lucide-react';

interface Score {
  id: string;
  playerName: string;
  score: number;
  createdAt: string;
}

interface LeaderboardProps {
  isVisible: boolean;
  onClose: () => void;
  playerScore: number;
  isIntroView?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isVisible, onClose, playerScore, isIntroView = false }) => {
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const result = await blink.db.leaderboard.list({
        orderBy: { score: 'desc' },
        limit: 10
      });
      setLeaderboard(result || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchLeaderboard();
      if (!isIntroView) {
        setScoreSubmitted(false);
        setPlayerName('');
      }
    }
  }, [isVisible, isIntroView]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || scoreSubmitted) return;

    try {
      setIsLoading(true);
      await blink.db.leaderboard.create({
        playerName: playerName.trim(),
        score: playerScore
      });
      setScoreSubmitted(true);
      await fetchLeaderboard();
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setScoreSubmitted(false);
    setPlayerName('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 text-white border border-slate-600 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-aex-green">
              {isIntroView ? 'Leaderboard' : 'Game Complete!'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Score Display for Game Over */}
          {!isIntroView && (
            <div className="text-center mb-6 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-lg text-slate-300 mb-2">Your Final Score</p>
              <p className="text-4xl font-bold text-yellow-400 mb-2">{playerScore.toLocaleString()}</p>
              {playerScore > 0 && (
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">Great job, Grid Guardian!</span>
                </div>
              )}
            </div>
          )}

          {/* Score Submission Form */}
          {!isIntroView && !scoreSubmitted && playerScore > 0 && (
            <form onSubmit={handleSubmitScore} className="mb-6">
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name for the leaderboard"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  maxLength={20}
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-aex-green hover:bg-green-600 text-white"
                  disabled={isLoading || !playerName.trim()}
                >
                  {isLoading ? 'Submitting...' : 'Submit Score'}
                </Button>
              </div>
            </form>
          )}

          {/* Success Message */}
          {!isIntroView && scoreSubmitted && (
            <div className="text-center mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-aex-green font-semibold">Score submitted successfully!</p>
            </div>
          )}

          {/* Leaderboard Table */}
          <div>
            <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top 10 Players
            </h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-aex-green border-t-transparent rounded-full mx-auto"></div>
                <p className="text-slate-400 mt-2">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300 font-semibold">Rank</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Player</TableHead>
                      <TableHead className="text-slate-300 font-semibold text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={entry.id} className="border-slate-600 hover:bg-slate-600/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-yellow-400">🥇</span>}
                            {index === 1 && <span className="text-gray-400">🥈</span>}
                            {index === 2 && <span className="text-orange-400">🥉</span>}
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-200">{entry.playerName}</TableCell>
                        <TableCell className="text-right font-bold text-aex-green">
                          {entry.score.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No scores yet. Be the first to play!</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={handleClose} 
              className="flex-1 bg-accent-blue hover:bg-blue-600 text-white"
            >
              {isIntroView ? 'Close' : 'Play Again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;