/**
 * ARCHON AWS DynamoDB Integration
 * Query and write to DynamoDB tables
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper: Simple AWS Signature V4 (Edge compatible)
async function awsSign(method: string, url: string, body: string, region: string) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  
  // Simplified - in production, use full AWS SigV4
  return {
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}`,
    'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
  };
}

/**
 * Query DynamoDB Table
 * POST /api/aws/dynamodb
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const operation = body.operation as string; // 'GetItem' | 'PutItem' | 'Query' | 'Scan'
    const tableName = body.tableName as string;
    const key = body.key;
    const item = body.item;
    
    if (!operation || !tableName) {
      return NextResponse.json(
        { error: 'operation and tableName are required' },
        { status: 400 }
      );
    }

    const region = process.env.AWS_REGION || 'us-east-1';
    const dynamoUrl = `https://dynamodb.${region}.amazonaws.com/`;

    // Build DynamoDB request
    let requestBody: any = { TableName: tableName };
    
    switch (operation) {
      case 'GetItem':
        if (!key) {
          return NextResponse.json({ error: 'key is required for GetItem' }, { status: 400 });
        }
        requestBody.Key = key;
        break;
      
      case 'PutItem':
        if (!item) {
          return NextResponse.json({ error: 'item is required for PutItem' }, { status: 400 });
        }
        requestBody.Item = item;
        break;
      
      case 'Query':
        requestBody = { ...requestBody, ...body.queryParams };
        break;
      
      case 'Scan':
        requestBody = { ...requestBody, ...body.scanParams };
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    const requestBodyStr = JSON.stringify(requestBody);
    const headers = await awsSign('POST', dynamoUrl, requestBodyStr, region);

    const response = await fetch(dynamoUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-amz-json-1.0',
        'X-Amz-Target': `DynamoDB_20120810.${operation}`,
      },
      body: requestBodyStr,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DynamoDB ${operation} failed: ${error}`);
    }

    const result = await response.json();

    return NextResponse.json({
      operation,
      tableName,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DynamoDB Error:', error);
    return NextResponse.json(
      { error: 'DynamoDB operation failed' },
      { status: 500 }
    );
  }
}

/**
 * List DynamoDB Tables
 * GET /api/aws/dynamodb
 */
export async function GET(req: NextRequest) {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Return known ARCHON tables
    return NextResponse.json({
      tables: [
        'ArchonWorkflows',
        'ArchonWorkflowLogs',
        'ArchonUserPreferences',
        'ArchonAPIUsage',
        'ArchonSystemState',
      ],
      region,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DynamoDB List Error:', error);
    return NextResponse.json(
      { error: 'Failed to list tables' },
      { status: 500 }
    );
  }
}
