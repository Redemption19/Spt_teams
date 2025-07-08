'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Region } from '@/lib/types';
import { useRolePermissions, useIsOwner } from '@/lib/rbac-hooks'; // Import RBAC hooks

interface RegionCardProps {
  region: Region;
  viewRegionDetails: (region: Region) => void;
  startEditRegion: (region: Region) => void;
  handleDeleteRegion: (region: Region) => void;
  isOwner: ReturnType<typeof useIsOwner>;
  canManageBranches: ReturnType<typeof useRolePermissions>['canManageBranches'];
}

export function RegionCard({
  region,
  viewRegionDetails,
  startEditRegion,
  handleDeleteRegion,
  isOwner,
  canManageBranches,
}: RegionCardProps) {
  return (
    <Card key={region.id} className="card-interactive border border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewRegionDetails(region)}
              className="h-8 w-8 p-0"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {(isOwner || canManageBranches) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditRegion(region)}
                  className="h-8 w-8 p-0"
                  title="Edit Region"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRegion(region)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  title="Delete Region"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>                  
        <div>
          <CardTitle className="text-lg">{region.name}</CardTitle>
          <p className="text-sm text-muted-foreground">Region</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {region.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{region.branches?.length || 0} branches</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}