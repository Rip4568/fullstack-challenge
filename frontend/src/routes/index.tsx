import { createFileRoute } from "@tanstack/react-router";
import { Lobby } from "../features/lobby/Lobby";

export const Route = createFileRoute("/")({ component: Lobby });
