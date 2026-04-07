import SwiftUI

struct HomeView: View {
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            List {
                Section("Quick Actions") {
                    NavigationLink("Create Project", destination: CreateProjectView())
                    NavigationLink("Invite Team Member", destination: InviteView())
                    NavigationLink("View Analytics", destination: AnalyticsView())
                }

                Section("Recent Projects") {
                    NavigationLink("Mobile App Redesign", destination: ProjectDetailView())
                    NavigationLink("API Gateway v2", destination: ProjectDetailView())
                    NavigationLink("Payment Integration", destination: ProjectDetailView())
                }

                Section("Settings") {
                    Label("Account", systemImage: "person.circle")
                    Label("Notifications", systemImage: "bell.fill")
                    Label("Preferences", systemImage: "gearshape.fill")
                }
            }
            .navigationTitle("Home")
            .searchable(text: $searchText, prompt: "Search projects...")
        }
    }
}

struct InviteView: View {
    @State private var email = ""
    @State private var role = "Member"

    var body: some View {
        NavigationStack {
            Form {
                Section("Invite Details") {
                    TextField("Email address", text: $email)
                    TextField("Full name", text: $name)
                }

                Section("Role") {
                    Toggle("Can edit projects", isOn: $canEdit)
                    Toggle("Admin access", isOn: $isAdmin)
                }

                Section("Pending Invites") {
                    Text("john@example.com")
                    Text("sarah@team.co")
                    Text("mike@company.com")
                }

                Button("Send Invite")
            }
            .navigationTitle("Invite")
        }
    }
}

struct ProfileView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    Label("Edit Profile", systemImage: "person.fill")
                    Label("Change Password", systemImage: "lock.fill")
                    Label("Two-Factor Auth", systemImage: "shield.fill")
                }

                Section("Preferences") {
                    Toggle("Dark Mode", isOn: .constant(true))
                    Toggle("Push Notifications", isOn: .constant(true))
                    Toggle("Email Digest", isOn: .constant(false))
                }

                Section("Danger Zone") {
                    Button("Delete Account")
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            InviteView()
                .tabItem {
                    Label("Team", systemImage: "person.2.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
        }
    }
}
