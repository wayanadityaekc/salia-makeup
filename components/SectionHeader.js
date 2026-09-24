export default function SectionHeader({ eyebrow, title, desc, center }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-base leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}
