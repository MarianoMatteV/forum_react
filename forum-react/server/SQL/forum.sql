create database forum_db;
use forum_db;
 
create table users (
	id int auto_increment primary key,
    username varchar(255) not null unique,
    email varchar(255) not null unique,
    password varchar(255) not null,
	profile_picture_url varchar(255) default null,
    created_at timestamp default current_timestamp
);
 
CREATE TABLE posts (
	id INT auto_increment PRIMARY KEY,
    user_id int not null,
    title varchar(255) not null,
    content text not null,
    image_url varchar(255) default null,
    created_at  timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (user_id) references users (id) on delete cascade
);
 
CREATE TABLE comments(
	id int auto_increment primary key,
    post_id int not null,
    user_id int not null,
    content text not null,
    created_at  timestamp default current_timestamp,
    foreign key (post_id) references posts (id) on delete cascade,
    foreign key (user_id) references users (id) on delete cascade
);
 
CREATE TABLE likes (
	id int auto_increment primary key,
    post_id int not null,
    user_id int not null,
	created_at  timestamp default current_timestamp,
	foreign key (post_id) references posts (id) on delete cascade,
    foreign key (user_id) references users (id) on delete cascade,
    UNIQUE (post_id, user_id)
);
 
CREATE TABLE favorites(
	id int auto_increment primary key,
    post_id int not null,
    user_id int not null,
    created_at  timestamp default current_timestamp,
	foreign key (post_id) references posts (id) on delete cascade,
    foreign key (user_id) references users (id) on delete cascade,
    UNIQUE (post_id, user_id)
);