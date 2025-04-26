// frontend/src/components/searchbar.tsx
"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming you have this utility from shadcn init

interface SearchBarProps {
  onSubmit: (address: string) => void;
  isLoading?: boolean; // Add isLoading prop to disable during fetch
  className?: string; // Allow custom styling
}

const SearchBar = ({ onSubmit, isLoading = false, className }: SearchBarProps) => {
  const [address, setAddress] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission page reload
    const trimmedAddress = address.trim();
    if (trimmedAddress && !isLoading) { // Only submit if not empty and not loading
      onSubmit(trimmedAddress);
      // Optionally clear the input after submission
      // setAddress("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full max-w-xl flex items-center gap-2", className)} // Use cn for merging classes
    >
      <Input
        type="text"
        placeholder="Enter property address (e.g., 123 Main St, Anytown, CA)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        disabled={isLoading} // Disable input while loading
        aria-label="Property Address Input"
        className="flex-grow" // Make input take available space
      />
      <Button type="submit" disabled={isLoading || !address.trim()}>
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
};

export default SearchBar;