CREATE DATABASE Insight;
GO
USE Insight;
GO
-----------------------------------------------------------------------
CREATE TABLE Author (
    Author_ID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(50),
    First_Name NVARCHAR(30),
    Last_Name NVARCHAR(30),
    Country NVARCHAR(30),
    Picture VARBINARY(MAX)
);

CREATE TABLE Field (
    Field_ID INT IDENTITY(1,1) PRIMARY KEY,
    Field_Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(300)
);

CREATE TABLE [User] (
    User_ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(30) NOT NULL,
    Email NVARCHAR(50) NOT NULL,
    Password NVARCHAR(200) NOT NULL,
    Role NVARCHAR(30),
    Photo VARBINARY(MAX)
);

CREATE TABLE Admin (
    Admin_ID INT PRIMARY KEY,
    Level NVARCHAR(30),
    FOREIGN KEY (Admin_ID) REFERENCES [User](User_ID)
);

CREATE TABLE Researcher (
    Researcher_ID INT PRIMARY KEY,
    Affiliation NVARCHAR(150),
    Specialization NVARCHAR(150),
    Join_Date DATE,
    FOREIGN KEY (Researcher_ID) REFERENCES [User](User_ID)
);

CREATE TABLE Paper (
    Paper_ID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(300),
    Abstract NVARCHAR(MAX),
    Publication_Date DATE,
    Path NVARCHAR(300),
    Field_ID INT,
    Admin_ID INT,
    FOREIGN KEY (Field_ID) REFERENCES Field(Field_ID),
    FOREIGN KEY (Admin_ID) REFERENCES Admin(Admin_ID)
);

CREATE TABLE Author_Paper (
    Author_ID INT,
    Paper_ID INT,
    Write_Date DATE,
    PRIMARY KEY (Author_ID, Paper_ID),
    FOREIGN KEY (Author_ID) REFERENCES Author(Author_ID),
    FOREIGN KEY (Paper_ID) REFERENCES Paper(Paper_ID)
);

CREATE TABLE Paper_Keywords (
    Paper_ID INT,
    Keywords NVARCHAR(MAX),
    FOREIGN KEY (Paper_ID) REFERENCES Paper(Paper_ID)
);

CREATE TABLE Search (
    Search_ID INT IDENTITY(1,1) PRIMARY KEY,
    Query NVARCHAR(300),
    Search_Date DATE,
    Researcher_ID INT,
    FOREIGN KEY (Researcher_ID) REFERENCES Researcher(Researcher_ID)
);

CREATE TABLE Download (
    Download_ID INT IDENTITY(1,1) PRIMARY KEY,
    Download_Date DATE,
    Paper_ID INT,
    Researcher_ID INT,
    FOREIGN KEY (Paper_ID) REFERENCES Paper(Paper_ID),
    FOREIGN KEY (Researcher_ID) REFERENCES Researcher(Researcher_ID)
);

CREATE TABLE Review (
    Review_ID INT IDENTITY(1,1) PRIMARY KEY,
    Rating INT,
    Review_Date DATE,
    Paper_ID INT,
    Researcher_ID INT,
    FOREIGN KEY (Paper_ID) REFERENCES Paper(Paper_ID),
    FOREIGN KEY (Researcher_ID) REFERENCES Researcher(Researcher_ID)
);
----------------------------------------------------------------------------------------
CREATE INDEX IX_Author_Email ON Author(Email);
CREATE INDEX IX_User_Email ON [User](Email);
CREATE INDEX IX_Paper_FieldID ON Paper(Field_ID);
CREATE INDEX IX_Paper_AdminID ON Paper(Admin_ID);
CREATE INDEX IX_Author_Paper_PaperID ON Author_Paper(Paper_ID);
CREATE INDEX IX_Search_ResearcherID ON Search(Researcher_ID);
CREATE INDEX IX_Download_PaperID ON Download(Paper_ID);
CREATE INDEX IX_Download_ResearcherID ON Download(Researcher_ID);
CREATE INDEX IX_Review_PaperID ON Review(Paper_ID);
CREATE INDEX IX_Review_ResearcherID ON Review(Researcher_ID);
-----------------------------------------------------------------------------------------