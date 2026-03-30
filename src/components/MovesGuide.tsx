"use client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MoveRowProps {
  notation: string;
  badge: string;         // e.g. "R"
  badgeColor: string;    // Tailwind bg class
  title: string;
  description: string;
  tip?: string;
  arrow: React.ReactNode;
}

// ─── Mini arrow visuals ───────────────────────────────────────────────────────
function ArrowUp()    { return <span className="text-4xl leading-none">⬆️</span>; }
function ArrowDown()  { return <span className="text-4xl leading-none">⬇️</span>; }
function ArrowRight() { return <span className="text-4xl leading-none">➡️</span>; }
function ArrowLeft()  { return <span className="text-4xl leading-none">⬅️</span>; }
function ArrowCW()    { return <span className="text-4xl leading-none">↻</span>; }
function ArrowCCW()   { return <span className="text-4xl leading-none">↺</span>; }
function ArrowTwo()   { return <span className="text-4xl leading-none">↔️</span>; }

// ─── One move row ─────────────────────────────────────────────────────────────
function MoveRow({ notation, badge, badgeColor, title, description, tip, arrow }: MoveRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Arrow */}
      <div className="w-10 shrink-0 flex justify-center pt-0.5">{arrow}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <code
            className={`${badgeColor} text-white font-black text-sm px-2.5 py-0.5 rounded-lg font-mono`}
          >
            {notation}
          </code>
          <span className="font-black text-gray-800 text-sm sm:text-base">{title}</span>
        </div>
        <p className="text-sm text-gray-600 font-semibold leading-snug">{description}</p>
        {tip && (
          <p className="text-xs text-indigo-600 font-bold mt-1">💡 {tip}</p>
        )}
      </div>

      {/* Face badge */}
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow"
        style={{ background: badgeColor.includes("red") ? "#ef4444"
                           : badgeColor.includes("orange") ? "#f97316"
                           : badgeColor.includes("gray") ? "#6b7280"
                           : badgeColor.includes("yellow") ? "#ca8a04"
                           : badgeColor.includes("green") ? "#22c55e"
                           : "#3b82f6" }}
      >
        {badge}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ emoji, title, subtitle, color }: {
  emoji: string; title: string; subtitle: string; color: string;
}) {
  return (
    <div className={`${color} rounded-2xl px-4 py-3 mb-1`}>
      <h3 className="font-black text-base sm:text-lg text-gray-800">
        {emoji} {title}
      </h3>
      <p className="text-xs sm:text-sm font-semibold text-gray-600">{subtitle}</p>
    </div>
  );
}

// ─── Main Guide modal ─────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export default function MovesGuide({ onClose }: Props) {
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm page-enter"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-indigo-700">📖 Move Guide</h2>
            <p className="text-sm font-semibold text-gray-500">What do all those letters mean?</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-lg active:scale-90 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-8 pt-4 space-y-5">

          {/* ── How it works ── */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-4">
            <h3 className="font-black text-indigo-800 text-base mb-2">🔑 The 3 rules of move notation</h3>
            <div className="space-y-2">
              <div className="flex gap-3 items-start">
                <code className="bg-indigo-600 text-white font-mono font-black text-sm px-2 py-0.5 rounded shrink-0">R</code>
                <p className="text-sm font-semibold text-gray-700">A single letter = turn that face <strong>once</strong> in its main direction</p>
              </div>
              <div className="flex gap-3 items-start">
                <code className="bg-purple-600 text-white font-mono font-black text-sm px-2 py-0.5 rounded shrink-0">R&apos;</code>
                <p className="text-sm font-semibold text-gray-700">The <strong>&apos;</strong> (tick) means <strong>opposite direction</strong> — like undoing the move</p>
              </div>
              <div className="flex gap-3 items-start">
                <code className="bg-rose-600 text-white font-mono font-black text-sm px-2 py-0.5 rounded shrink-0">R2</code>
                <p className="text-sm font-semibold text-gray-700">The <strong>2</strong> means turn it <strong>twice</strong> in a row</p>
              </div>
            </div>
          </div>

          {/* ── Hold position reminder ── */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-sm font-semibold text-amber-800">
            📌 <strong>Always</strong> keep the cube the same way: <strong>White on top</strong>, <strong>Green facing you</strong>. Don&apos;t rotate the whole cube between steps!
          </div>

          {/* ── RIGHT face ── */}
          <div>
            <SectionHeader
              emoji="🔴"
              title="R — Right side"
              subtitle="The column on the right (the Red face)"
              color="bg-red-50"
            />
            <div className="bg-white rounded-2xl border border-red-100 px-3 divide-y divide-red-50">
              <MoveRow notation="R"  badge="R" badgeColor="bg-red-500"
                title="Right side UP"
                description="Grab the right column and push the top away from you (upward). The right-bottom sticker moves to the right-top."
                tip="Think of it as rolling a wheel forward on the right side."
                arrow={<ArrowUp />} />
              <MoveRow notation="R'" badge="R" badgeColor="bg-red-500"
                title="Right side DOWN"
                description="Grab the right column and pull the top toward you (downward). The opposite of R."
                tip="The tick ' always means 'do it backwards'."
                arrow={<ArrowDown />} />
              <MoveRow notation="R2" badge="R" badgeColor="bg-red-500"
                title="Right side TWICE"
                description="Do the R move two times in a row. The right column ends up flipped completely."
                arrow={<ArrowTwo />} />
            </div>
          </div>

          {/* ── LEFT face ── */}
          <div>
            <SectionHeader
              emoji="🟠"
              title="L — Left side"
              subtitle="The column on the left (the Orange face)"
              color="bg-orange-50"
            />
            <div className="bg-white rounded-2xl border border-orange-100 px-3 divide-y divide-orange-50">
              <MoveRow notation="L"  badge="L" badgeColor="bg-orange-500"
                title="Left side DOWN"
                description="Grab the left column and push the top toward you (downward). The left-top sticker moves to the left-bottom."
                tip="L goes down — the opposite direction of R!"
                arrow={<ArrowDown />} />
              <MoveRow notation="L'" badge="L" badgeColor="bg-orange-500"
                title="Left side UP"
                description="Grab the left column and pull the top away from you (upward). The opposite of L."
                arrow={<ArrowUp />} />
              <MoveRow notation="L2" badge="L" badgeColor="bg-orange-500"
                title="Left side TWICE"
                description="Do the L move two times in a row."
                arrow={<ArrowTwo />} />
            </div>
          </div>

          {/* ── UP face ── */}
          <div>
            <SectionHeader
              emoji="⬜"
              title="U — Top layer"
              subtitle="The row on top (the White face)"
              color="bg-gray-50"
            />
            <div className="bg-white rounded-2xl border border-gray-200 px-3 divide-y divide-gray-100">
              <MoveRow notation="U"  badge="U" badgeColor="bg-gray-500"
                title="Top layer to the RIGHT"
                description="Slide the whole top row to the right. The front-top sticker moves to the right side."
                tip="U spins right — like turning a steering wheel right."
                arrow={<ArrowRight />} />
              <MoveRow notation="U'" badge="U" badgeColor="bg-gray-500"
                title="Top layer to the LEFT"
                description="Slide the whole top row to the left. The opposite of U."
                arrow={<ArrowLeft />} />
              <MoveRow notation="U2" badge="U" badgeColor="bg-gray-500"
                title="Top layer TWICE"
                description="Slide the top row twice — it ends up going the other direction."
                arrow={<ArrowTwo />} />
            </div>
          </div>

          {/* ── DOWN face ── */}
          <div>
            <SectionHeader
              emoji="🟡"
              title="D — Bottom layer"
              subtitle="The row at the bottom (the Yellow face)"
              color="bg-yellow-50"
            />
            <div className="bg-white rounded-2xl border border-yellow-100 px-3 divide-y divide-yellow-50">
              <MoveRow notation="D"  badge="D" badgeColor="bg-yellow-600"
                title="Bottom layer to the LEFT"
                description="Slide the whole bottom row to the left. The front-bottom sticker moves to the left side."
                tip="D is the opposite direction of U — it goes left!"
                arrow={<ArrowLeft />} />
              <MoveRow notation="D'" badge="D" badgeColor="bg-yellow-600"
                title="Bottom layer to the RIGHT"
                description="Slide the whole bottom row to the right. The opposite of D."
                arrow={<ArrowRight />} />
              <MoveRow notation="D2" badge="D" badgeColor="bg-yellow-600"
                title="Bottom layer TWICE"
                description="Slide the bottom row twice in a row."
                arrow={<ArrowTwo />} />
            </div>
          </div>

          {/* ── FRONT face ── */}
          <div>
            <SectionHeader
              emoji="🟢"
              title="F — Front face"
              subtitle="The face looking straight at you (the Green face)"
              color="bg-green-50"
            />
            <div className="bg-white rounded-2xl border border-green-100 px-3 divide-y divide-green-50">
              <MoveRow notation="F"  badge="F" badgeColor="bg-green-600"
                title="Front face Clockwise ↻"
                description="Turn the front face like a clock — top goes right, right goes down, bottom goes left, left goes up."
                tip="Look straight at the green face, then turn it like a clock!"
                arrow={<ArrowCW />} />
              <MoveRow notation="F'" badge="F" badgeColor="bg-green-600"
                title="Front face Counter-clockwise ↺"
                description="Turn the front face the other way — top goes left, left goes down, bottom goes right."
                tip="The tick ' means backwards — the opposite of a clock!"
                arrow={<ArrowCCW />} />
              <MoveRow notation="F2" badge="F" badgeColor="bg-green-600"
                title="Front face TWICE"
                description="Turn the front face two times in a row."
                arrow={<ArrowTwo />} />
            </div>
          </div>

          {/* ── BACK face ── */}
          <div>
            <SectionHeader
              emoji="🔵"
              title="B — Back face"
              subtitle="The face on the back side (the Blue face)"
              color="bg-blue-50"
            />
            <div className="bg-white rounded-2xl border border-blue-100 px-3 divide-y divide-blue-50">
              <MoveRow notation="B"  badge="B" badgeColor="bg-blue-500"
                title="Back face Clockwise ↻"
                description="Turn the back face like a clock — but you are looking at it from behind! Tilt the cube to look at the blue face, then turn clockwise."
                tip="Flip the cube to look at the blue side, then turn like a clock."
                arrow={<ArrowCW />} />
              <MoveRow notation="B'" badge="B" badgeColor="bg-blue-500"
                title="Back face Counter-clockwise ↺"
                description="Turn the back face the other way (when looking at the blue face from behind)."
                arrow={<ArrowCCW />} />
              <MoveRow notation="B2" badge="B" badgeColor="bg-blue-500"
                title="Back face TWICE"
                description="Turn the back face two times in a row."
                arrow={<ArrowTwo />} />
            </div>
          </div>

          {/* ── Quick cheat sheet ── */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-4">
            <h3 className="font-black text-indigo-800 text-base mb-3">⚡ Quick cheat sheet</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm font-semibold text-gray-700">
              {[
                ["R",  "Right → UP"],
                ["R'", "Right → DOWN"],
                ["L",  "Left → DOWN"],
                ["L'", "Left → UP"],
                ["U",  "Top → RIGHT"],
                ["U'", "Top → LEFT"],
                ["D",  "Bottom → LEFT"],
                ["D'", "Bottom → RIGHT"],
                ["F",  "Front → Clockwise ↻"],
                ["F'", "Front → Counter ↺"],
                ["B",  "Back → Clockwise ↻"],
                ["B'", "Back → Counter ↺"],
              ].map(([code, desc]) => (
                <div key={code} className="flex items-center gap-2">
                  <code className="bg-indigo-600 text-white font-mono font-black text-xs px-1.5 py-0.5 rounded min-w-[28px] text-center shrink-0">
                    {code}
                  </code>
                  <span className="text-xs">{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-indigo-600 mt-3 text-center">
              Add <code className="bg-indigo-100 px-1 rounded">2</code> after any letter = do it TWICE!
            </p>
          </div>

        </div>

        {/* Close button at bottom */}
        <div className="px-5 pb-5 pt-2 shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white font-black text-xl rounded-2xl active:scale-95 transition-transform shadow-lg"
          >
            Got it! Let&apos;s solve! 🧩
          </button>
        </div>
      </div>
    </div>
  );
}
