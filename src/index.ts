import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

const CORS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, Accept, Mcp-Session-Id, mcp-protocol-version, last-event-id",
	"Access-Control-Expose-Headers": "Mcp-Session-Id",
	"Access-Control-Max-Age": "86400",
};

function createServer() {
	const server = new McpServer({
		name: "Sequential Thinking",
		version: "1.0.0",
	});

	server.registerTool(
		"sequentialthinking",
		{
			title: "Sequential Thinking",
			description:
				"A detailed tool for dynamic and reflective problem-solving through thoughts. Each thought can build on, question, or revise previous insights as understanding deepens. Use for breaking down complex problems into steps, planning and design with room for revision, analysis that may need course correction, and multi-step solutions that require context preservation.",
			inputSchema: z.object({
				thought: z.string().describe("Your current thinking step"),
				nextThoughtNeeded: z
					.boolean()
					.describe("Whether another thought step is needed"),
				thoughtNumber: z
					.number()
					.int()
					.min(1)
					.describe("Current thought number"),
				totalThoughts: z
					.number()
					.int()
					.min(1)
					.describe("Estimated total thoughts needed"),
				isRevision: z
					.boolean()
					.optional()
					.describe("Whether this revises previous thinking"),
				revisesThought: z
					.number()
					.int()
					.min(1)
					.optional()
					.describe("Which thought is being reconsidered"),
				branchFromThought: z
					.number()
					.int()
					.min(1)
					.optional()
					.describe("Branching point thought number"),
				branchId: z.string().optional().describe("Branch identifier"),
				needsMoreThoughts: z
					.boolean()
					.optional()
					.describe("If more thoughts are needed"),
			}),
		},
		async ({
			thought,
			nextThoughtNeeded,
			thoughtNumber,
			totalThoughts,
			isRevision,
			revisesThought,
			branchFromThought,
			branchId,
			needsMoreThoughts,
		}) => {
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(
							{
								thought,
								thoughtNumber,
								totalThoughts,
								nextThoughtNeeded,
								...(isRevision !== undefined ? { isRevision } : {}),
								...(revisesThought !== undefined ? { revisesThought } : {}),
								...(branchFromThought !== undefined
									? { branchFromThought }
									: {}),
								...(branchId !== undefined ? { branchId } : {}),
								...(needsMoreThoughts !== undefined
									? { needsMoreThoughts }
									: {}),
							},
							null,
							2,
						),
					},
				],
			};
		},
	);

	return server;
}

const handler = createMcpHandler(createServer);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS });
		}
		const response = await handler(request, env, ctx);
		const headers = new Headers(response.headers);
		for (const [key, value] of Object.entries(CORS)) {
			headers.set(key, value);
		}
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	},
} satisfies ExportedHandler<Env>;
