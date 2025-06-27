"use client";
import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { HeroVideo } from './page';

function HeroVideoItem({ id, title, videoUrl }: HeroVideo) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white rounded-lg shadow p-4 flex flex-col items-center border mb-4">
      <video src={videoUrl} controls className="w-full h-40 object-cover rounded mb-2" />
      <p className="font-semibold text-center">{title}</p>
    </div>
  );
}

export default function HeroVideoGrid({ videos, setVideos }: { videos: HeroVideo[]; setVideos: (v: HeroVideo[]) => void }) {
  // Only show 3 slots, fill with empty if needed
  const sorted = [...videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const padded = [...sorted];
  while (padded.length < 3) padded.push(null as any);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);
    const newOrder = arrayMove<HeroVideo>(videos, oldIndex, newIndex);
    setVideos(newOrder);
    // Call reorder API
    await fetch("/api/admin/hero-videos/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds: newOrder.map((v, i) => ({ id: v.id, order: i })) }),
      headers: { "Content-Type": "application/json" }
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.filter(Boolean).map((v) => v.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
          {padded.map((v, i) =>
            v ? (
              <HeroVideoItem key={v.id} id={v.id} title={v.title} videoUrl={v.videoUrl} />
            ) : (
              <div key={"empty-" + i} className="bg-gray-100 rounded-lg shadow p-4 flex flex-col items-center border mb-4 min-h-[180px] justify-center text-gray-400">
                Empty Slot
              </div>
            )
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
} 