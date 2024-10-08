import { NextResponse } from "next/server";

type PostResponse = {
  status: number;
  message: string;
};

type GetResponse = {
  status: number;
  balancedTeams: string;
};

let balancedTeams: string;

export async function POST(request: Request) {
  console.debug("POST called");
  try {
    const data = await request.json();
    balancedTeams = JSON.stringify(data);
    const response: PostResponse = {
      status: 200,
      message: "Teams stored",
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: PostResponse = {
      status: 500,
      message: "Internal Server Error.",
    };
    return NextResponse.json(response);
  }
}

export async function GET() {
  console.debug("GET called");
  try {
    const response: GetResponse = {
      status: 200,
      balancedTeams,
    };
    return NextResponse.json(response);
  } catch (error) {
    const response: PostResponse = {
      status: 500,
      message: "Internal Server Error.",
    };
    return NextResponse.json(response);
  }
}
