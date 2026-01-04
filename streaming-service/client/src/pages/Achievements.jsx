import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useUser } from "../UserContext.jsx";

export default function Achievements() {
  const { user } = useUser();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [user]);

  async function loadAchievements() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getUserAchievements(user.id);
      setAchievements(data);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setLoading(false);
    }
  }

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalPoints = achievements
    .filter(a => a.unlockedAt)
    .reduce((sum, a) => sum + a.points, 0);

  if (!user) {
    return (
      <div className="container">
        <div style={{ textAlign: "center", padding: 60 }}>
          <h2>Please Login</h2>
          <p className="subtle">You need to be logged in to view achievements</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: "center", padding: 60 }}>
          <h2>Loading Achievements...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 40 }}>
        <h1 className="pageTitle">🏆 Achievements</h1>
        <div style={{ display: "flex", gap: 32, marginTop: 20 }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Unlocked</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{unlockedCount} / {achievements.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Total Points</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)" }}>{totalPoints}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Progress</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {achievements.map(achievement => {
          const isUnlocked = !!achievement.unlockedAt;
          
          return (
            <div
              key={achievement.id}
              style={{
                backgroundColor: "var(--panel)",
                padding: 24,
                borderRadius: 12,
                border: `2px solid ${isUnlocked ? "var(--primary)" : "var(--border)"}`,
                opacity: isUnlocked ? 1 : 0.6,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {isUnlocked && (
                <div style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  Unlocked
                </div>
              )}
              
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {achievement.icon}
              </div>
              
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 20 }}>
                {achievement.name}
              </h3>
              
              <p style={{ margin: 0, marginBottom: 12, fontSize: 14, opacity: 0.8, lineHeight: 1.5 }}>
                {achievement.description}
              </p>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{
                  backgroundColor: "var(--bg)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--primary)"
                }}>
                  {achievement.points} points
                </div>
                
                {isUnlocked && achievement.unlockedAt && (
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
          No achievements available yet.
        </div>
      )}
    </div>
  );
}
