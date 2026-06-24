import Hero from "./components/Hero";

export default function Home() {
  return (
    <main>
      <Hero />
      {/* Placeholder for the next section — gives the page scroll room so the
          hero's scroll-out animation can play. Replace with real content. */}
      <section
        style={{
          minHeight: "100vh",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-ui)",
          color: "var(--ink)",
          fontSize: 20,
        }}
      >
        Next section coming soon
      </section>
    </main>
  );
}
