# 🏎️ Neon Turbo Racer

**Neon Turbo Racer** is a high-octane, retro-futuristic 2D top-down racing game. Built for speed and precision, it challenges players to navigate through intense traffic, dodge deadly obstacles, and climb through 5 increasingly difficult levels to become a racing legend.

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen)
![Tech](https://img.shields.io/badge/Tech-React%2019%20%2B%20Vite-blue)
![Platform](https://img.shields.io/badge/Platform-Web%20%2F%20Mobile-orange)

---

## 🚀 How to Play

1.  **Enter your Driver ID**: Start by typing your name in the main menu.
2.  **Survive the Clock**: Each level lasts **30 seconds**. Your goal is to reach the end of the timer without losing all your lives.
3.  **Dodge & Weave**: Avoid NPC cars and road obstacles. Every collision costs a life!
4.  **Collect Power-ups**: Grab the **Glowing Stars** to gain temporary invincibility and boost your score.
5.  **Score Big**: Points are awarded for distance traveled, cars passed, and bonus pickups.

---

## 🕹️ Controls

The game is fully responsive and supports both Desktop and Mobile devices.

### 💻 Desktop (Keyboard)
| Key | Action |
| :--- | :--- |
| `↑` or `W` | Accelerate Forward |
| `↓` or `S` | Brake / Reverse |
| `←` or `A` | Steer Left |
| `→` or `D` | Steer Right |

### 📱 Mobile (Touch)
*   **On-screen D-Pad**: Use the directional buttons at the bottom of the screen to steer and control speed.
*   **Intuitive Layout**: Left/Right steering on the left, Up/Down on the right for a console-like experience.

---

## ✨ Features

-   **5 Challenging Levels**: Each level features unique color themes, higher speeds, and denser traffic.
-   **Retro-Futuristic Aesthetics**: Vibrant neon visuals, grid-based backgrounds, and high-contrast designs.
-   **Dynamic FX**: Screen shake on collisions, particle explosions, and smooth canvas animations.
-   **Power-up System**: Temporary invincibility shields with a visual pulse effect and dedicated HUD timer.
-   **Procedural Audio**: 
    -   Dynamic engine sounds that change pitch based on car speed.
    -   Synthesized chiptune sound effects for crashes, pickups, and level clears.
-   **Advanced HUD**: Real-time tracking of lives, score, remaining time, and shield duration.
-   **Collision Guard**: Robust synchronization logic to ensure fair play and prevent double-life loss.

---

## 🛠️ Technical Stack

-   **Frontend**: React 19 (Functional Components & Hooks)
-   **Rendering**: HTML5 Canvas API for high-performance 60FPS gameplay.
-   **Styling**: Tailwind CSS for a sleek, modern UI.
-   **Audio**: Web Audio API for real-time sound synthesis (no external MP3 files needed!).
-   **Build Tool**: Vite for lightning-fast development and optimized bundles.
-   **Compatibility**: Optimized for Safari (iOS) and modern Chromium browsers.

---

## 🔧 Development & Installation

To run the game locally:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/deedmitrij/car-racing-game.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the engine**:
    ```bash
    npm run dev
    ```
4.  **Open in browser**: Navigate to `http://localhost:3000`.

---

*Designed with ❤️ for young racers and retro arcade fans.*