"use client";

import { FormEvent } from "react";

export default function Home() {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/process-chat", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("failed to submit the data. Please try again.");
      }
    } catch (error) {
      console.error(error);
    }
  }
  function placeholder(): string {
    var placeHolder: string = "";
    for (var i = 0; i < 10; i++) {
      if (i != 9) placeHolder += "GameName#Tag has joined the lobby\n";
      else placeHolder += "GameName#Tag has joined the lobby";
    }
    return placeHolder;
  }

  return (
    <div className="bg-[#010A13]">
      <header>
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center sm:py-64 lg:px-0">
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl font-beaufort uppercase text-[#C89B3C]">
            League of Legends Autobalancer
          </h1>
          <p className="mt-4 font-spiegel text-[#A09B8C] font-medium text-md">
            An autobalancing tool for your League of Legends custom 5v5 lobbies.
          </p>
        </div>
      </header>
      <main>
        <div className=""></div>
      </main>
    </div>
  );
}
