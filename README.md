# CPipe - Modern Kanban Project Management

CPipe is a high-performance, real-time Kanban project management application built with **Convex**, **React**, and **TypeScript**. It is designed to streamline task management, enhance team collaboration, and provide deep visibility into project lifecycles.

## 🚀 Key Features

### 📋 Advanced Kanban Board
- **Real-time Synchronization**: Powered by Convex, every change is reflected across all clients instantly.
- **Dynamic Drag-and-Drop**: Smooth, intuitive task and column reordering using `@dnd-kit`.
- **Flexible Layouts**: Switch between traditional horizontal scrolling and multi-column grid views (2, 3, or 4 columns).
- **Optimistic Updates**: Zero-latency UI response for a premium desktop-app feel.

### 🛠 Task Management
- **Detailed Task Cards**: Track titles, descriptions, story points, and rich labels.
- **Smart Timeline**: Manage project schedules with integrated **Start** and **Due Date** range pickers.
- **Status & Priority**: Keep your team aligned with "On Track", "At Risk", or "Off Track" statuses and priority flags (Low to Urgent).
- **Rich Activity Logs**: Every move, edit, and update is tracked in a real-time audit trail.

### 💬 Team Collaboration
- **Interactive Comments**: Threaded discussions directly on task cards with user profile integration.
- **Identity Resolution**: Intelligent display name prioritization (Profile Display Name > Username > Email).
- **Project Context**: Activity feeds are project-aware, allowing you to filter by specific workstreams.

### 🛡 Enterprise-Grade Foundation
- **Multi-tenant Workspaces**: Separate environments for different teams or organizations.
- **Role-Based Access Control**: Granular permissions (Owner, Admin, Editor, Viewer).
- **Modern UI/UX**: Built with Radix UI and Tailwind CSS for a sleek, glassmorphic aesthetic.

## 🏗 Tech Stack

- **Backend**: [Convex](https://www.convex.dev/) (Real-time DB, Auth, and Functions)
- **Frontend**: React 19, Vite, TanStack Router
- **Styling**: Tailwind CSS, Shadcn/UI
- **Drag & Drop**: dnd-kit
- **Icons**: Lucide React

## 🛠 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Convex dev server**:
   ```bash
   npx convex dev
   ```

3. **Start the frontend**:
   ```bash
   npm run dev
   ```

## 📈 Future Roadmap
- [ ] Cursor-based pagination for large activity logs.
- [ ] Multi-assignee support per card.
- [ ] Advanced project analytics and burndown charts.
- [ ] File attachments on comments.

---
Built with ❤️ for teams that move fast.
