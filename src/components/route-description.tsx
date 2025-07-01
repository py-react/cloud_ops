import React, { ReactNode } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function RouteDescription({
	title,
	shortDescription,
	description
}: {
	title: string | ReactNode;
	shortDescription: string;
	description?: string;
}) {
	return (
		<Card className="p-4 rounded-[0.5rem] shadow-sm bg-white border border-gray-200">
			<CardHeader>
				<CardTitle className="text-xl">{title}</CardTitle>
				<CardDescription className="text-base">
					{shortDescription}
				</CardDescription>
			</CardHeader>
			{description && (
				<CardContent className="shadow-none">
					<div className="space-y-1">
						<div className="text-sm text-muted-foreground">
							{description}
						</div>
					</div>
				</CardContent>
			)}
		</Card>
	)

}