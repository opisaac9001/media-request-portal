import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { isAdminAuthenticated } from '../../../lib/adminAuth';

interface Service {
  name?: string;
  url?: string;
  description?: string;
  icon?: string;
}

// Helper function to read services from .env.local
function readServices(): Service[] {
  const envPath = path.join(process.cwd(), '.env.local');
  const services: Service[] = [];

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('SERVICE_') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        
        // Extract service number and property
        const match = key.match(/SERVICE_(\d+)_(NAME|URL|DESCRIPTION|ICON)/);
        if (match) {
          const serviceNum = parseInt(match[1]);
          const property = match[2].toLowerCase() as keyof Service;
          
          if (!services[serviceNum]) {
            services[serviceNum] = {};
          }
          
          services[serviceNum][property] = value;
        }
      }
    }
    
    // Filter out empty slots and return valid services
    return services.filter(s => s && s.name && s.url);
  }

  return [];
}

// Helper function to write services to .env.local
function writeServices(newServices: Service[]): void {
  const envPath = path.join(process.cwd(), '.env.local');
  
  // Read existing env file
  let existingContent = '';
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, 'utf-8');
  }
  
  // Remove old SERVICE_ entries
  const lines = existingContent.split('\n');
  const filteredLines = lines.filter(line => !line.trim().startsWith('SERVICE_'));
  
  // Add service configuration header and entries
  let content = filteredLines.join('\n').trim() + '\n\n';
  content += '# Protected Services Configuration\n';
  content += '# These services will be accessible only after admin login\n';
  
  newServices.forEach((service, index) => {
    if (service.name && service.url) {
      content += `SERVICE_${index}_NAME=${service.name}\n`;
      content += `SERVICE_${index}_URL=${service.url}\n`;
      content += `SERVICE_${index}_DESCRIPTION=${service.description || ''}\n`;
      content += `SERVICE_${index}_ICON=${service.icon || '🔗'}\n`;
    }
  });
  
  fs.writeFileSync(envPath, content, 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated',
    });
  }

  if (req.method === 'GET') {
    // Return current services
    const services = readServices();
    
    return res.status(200).json({
      authenticated: true,
      services,
    });
  } else if (req.method === 'POST') {
    // Save services
    const { services } = req.body;

    try {
      writeServices(services);
      
      return res.status(200).json({
        success: true,
        message: 'Services saved successfully',
      });
    } catch (error) {
      console.error('Failed to save services:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save services',
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
