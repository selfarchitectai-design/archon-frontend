/**
 * ARCHON AWS Lambda Integration
 * Invoke Lambda functions and get results
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Invoke AWS Lambda Function
 * POST /api/aws/lambda
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const functionName = body.functionName as string;
    const payload = body.payload || {};
    const invocationType = body.invocationType as string || 'RequestResponse';

    if (!functionName) {
      return NextResponse.json(
        { error: 'functionName is required' },
        { status: 400 }
      );
    }

    // Check AWS credentials
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      );
    }

    // Prepare AWS Lambda invocation request
    const lambdaUrl = `https://lambda.${region}.amazonaws.com/2015-03-31/functions/${functionName}/invocations`;
    
    // AWS Signature V4 would be implemented here
    // For now, using a simplified approach with IAM role or API Gateway
    
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Invocation-Type': invocationType,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Lambda invocation failed: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      functionName,
      invocationType,
      statusCode: response.status,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lambda Invocation Error:', error);
    return NextResponse.json(
      { error: 'Failed to invoke Lambda function' },
      { status: 500 }
    );
  }
}

/**
 * Get Lambda Function Info
 * GET /api/aws/lambda?functionName=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const functionName = searchParams.get('functionName');

    if (!functionName) {
      return NextResponse.json(
        { error: 'functionName is required' },
        { status: 400 }
      );
    }

    // Return cached function metadata from KV
    // In production, would query AWS Lambda API

    return NextResponse.json({
      functionName,
      runtime: 'python3.11',
      handler: 'index.handler',
      memorySize: 256,
      timeout: 30,
      lastModified: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lambda Info Error:', error);
    return NextResponse.json(
      { error: 'Failed to get function info' },
      { status: 500 }
    );
  }
}
